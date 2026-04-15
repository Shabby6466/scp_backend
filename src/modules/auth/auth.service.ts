import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';
import { MailerService } from '../mailer/mailer.service';
import { SettingsService } from '../settings/settings.service';
import { LoginDto, RegisterDto, VerifyEmailDto } from './dto/index';
import { AuthOtp } from '../../entities/auth-otp.entity';
import { UserRole } from '../common/enums/database.enum';
import { UserService } from '../user/user.service';

const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;
const RATE_LIMIT_MINUTES = 1;

function generateOtp(): string {
  const digits = crypto.randomInt(0, 1_000_000);
  return digits.toString().padStart(OTP_LENGTH, '0');
}

async function hashOtp(code: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(code, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
  return `${salt}:${hash.toString('hex')}`;
}

async function verifyOtpHash(code: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;
  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(code, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
  const storedBuf = Buffer.from(hashHex, 'hex');
  return crypto.timingSafeEqual(hash, storedBuf);
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @InjectRepository(AuthOtp)
    private readonly authOtpRepository: Repository<AuthOtp>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mailer: MailerService,
    private readonly settings: SettingsService,
  ) { }

  async login(dto: LoginDto): Promise<{ user: object; accessToken: string }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userService.findOneByEmailForAuth(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { otpEmailVerificationEnabled } = await this.settings.getPublic();
    if (otpEmailVerificationEnabled && !user.emailVerifiedAt) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role === UserRole.STUDENT) {
      throw new UnauthorizedException('Students cannot log in directly');
    }

    const accessToken = await this.generateAccessToken(
      user.id,
      user.email,
      user.role,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        branchId: user.branchId,
        school: user.school,
        branch: user.branch,
      },
      accessToken,
    };
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ message: string; skipVerification?: boolean }> {
    const flags = await this.settings.getPublic();
    if (!flags.selfRegistrationEnabled) {
      throw new ForbiddenException('Self-service registration is disabled');
    }

    const email = dto.email.toLowerCase().trim();
    const existing = await this.userService.findOneByEmailInternal(email);

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    if (!flags.otpEmailVerificationEnabled) {
      await this.userService.createSelfRegisteredUser({
        email,
        name: dto.name.trim(),
        passwordHash: hashedPassword,
        role: UserRole.TEACHER,
        verified: true,
      });

      this.logger.log(`User registered: ${email} (verified, no OTP)`);
      return {
        message: 'Account created. You can sign in now.',
        skipVerification: true,
      };
    }

    await this.userService.createSelfRegisteredUser({
      email,
      name: dto.name.trim(),
      passwordHash: hashedPassword,
      role: UserRole.TEACHER,
      verified: false,
    });

    await this.sendVerificationOtp(email, false);

    this.logger.log(`User registered: ${email} (pending verification)`);
    return { message: 'Check your email for the verification code' };
  }

  async verifyEmail(
    dto: VerifyEmailDto,
  ): Promise<{ user: object; accessToken: string }> {
    const email = dto.email.toLowerCase().trim();
    const hasCode = typeof dto.code === 'string' && /^\d{6}$/.test(dto.code);
    const hasToken = typeof dto.token === 'string' && dto.token.length >= 32;
    if (!hasCode && !hasToken) {
      throw new BadRequestException(
        'Provide the 6-digit code or open the invite link from your email.',
      );
    }
    const secret = (hasCode ? dto.code : dto.token) as string;

    const candidates = await this.authOtpRepository.find({
      where: {
        email,
        consumedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    let otp: AuthOtp | null = null;
    for (const row of candidates) {
      if (await verifyOtpHash(secret, row.codeHash)) {
        otp = row;
        break;
      }
    }

    if (!otp) {
      throw new UnauthorizedException(
        'Invalid or expired code. Please request a new one.',
      );
    }

    otp.consumedAt = new Date();
    await this.authOtpRepository.save(otp);

    const user = await this.userService.findOneByEmailInternal(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const hashedPassword = dto.password ? await bcrypt.hash(dto.password, 12) : undefined;
    await this.userService.markEmailVerified(user.id, hashedPassword);

    const updated = await this.userService.findOneByEmailWithRelations(email, ['school', 'branch']);

    const accessToken = await this.generateAccessToken(
      updated!.id,
      updated!.email,
      updated!.role,
    );

    return {
      user: {
        id: updated!.id,
        email: updated!.email,
        name: updated!.name,
        role: updated!.role,
        schoolId: updated!.schoolId,
        branchId: updated!.branchId,
        school: updated!.school,
        branch: updated!.branch,
      },
      accessToken,
    };
  }

  async getProfile(userId: string) {
    const actor = { id: userId, role: UserRole.ADMIN, schoolId: null, branchId: null }; // Dummy for findOneById
    const user = await this.userService.getUserDetail(userId, actor as any);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    let ownerDirector: { id: string; name: string | null; email: string } | null = null;
    let ownerBranchDirector: { id: string; name: string | null; email: string } | null = null;

    if (user.role === UserRole.TEACHER) {
      if (user.schoolId) {
        ownerDirector = await this.userService.findDirectorBySchool(user.schoolId);
      }
      if (user.branchId) {
        ownerBranchDirector = await this.userService.findBranchDirectorByBranch(user.branchId);
      }
    }

    const hasPassword = user.password != null && user.password.length > 0;
    const { password: _p, ...rest } = user;
    return { ...rest, ownerDirector, ownerBranchDirector, hasPassword };
  }

  async sendVerificationOtp(
    email: string,
    requireUnverifiedUser = false,
  ): Promise<void> {
    const { otpEmailVerificationEnabled } = await this.settings.getPublic();
    if (!otpEmailVerificationEnabled) {
      throw new BadRequestException(
        'Email verification codes are disabled on this system.',
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (requireUnverifiedUser) {
      const user = await this.userService.findOneByEmailInternal(normalizedEmail);
      if (!user || user.emailVerifiedAt) {
        throw new UnauthorizedException(
          'No pending verification found for this email',
        );
      }
    }

    const recent = await this.authOtpRepository.findOne({
      where: {
        email: normalizedEmail,
        consumedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (recent) {
      const elapsed = Date.now() - recent.createdAt.getTime();
      if (elapsed < RATE_LIMIT_MINUTES * 60 * 1000) {
        throw new BadRequestException(
          `Please wait ${RATE_LIMIT_MINUTES} minute(s) before requesting a new code`,
        );
      }
    }

    const code = generateOtp();
    const codeHash = await hashOtp(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const otp = this.authOtpRepository.create({
      email: normalizedEmail,
      codeHash,
      expiresAt,
    });
    await this.authOtpRepository.save(otp);

    await this.mailer.sendVerificationCode(normalizedEmail, code);
  }

  async resendVerification(email: string): Promise<void> {
    await this.sendVerificationOtp(email, true);
  }

  /** When OTP emails are off, this is not called (see UserService). No-op if invoked. */
  async sendInviteOtp(email: string, inviterName?: string): Promise<void> {
    const { otpEmailVerificationEnabled } = await this.settings.getPublic();
    if (!otpEmailVerificationEnabled) {
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const code = generateOtp();
    const codeHash = await hashOtp(code);

    const otp = this.authOtpRepository.create({
      email: normalizedEmail,
      codeHash,
      expiresAt,
    });
    await this.authOtpRepository.save(otp);

    await this.mailer.sendInvite(normalizedEmail, code, inviterName);
  }

  private async generateAccessToken(
    userId: string,
    email: string,
    role: string,
    expiryTime?: number | string | null,
  ) {
    const finalExpiry = expiryTime || this.config.get<string>('JWT_EXPIRATION') || '1d';
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      {
        secret: this.config.get<string>('JWT_SECRET') || process.env.JWT_SECRET,
        expiresIn: finalExpiry as any,
      },
    );

    return accessToken;
  }
}

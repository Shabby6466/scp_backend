"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const mailer_service_1 = require("../mailer/mailer.service");
const settings_service_1 = require("../settings/settings.service");
const auth_otp_entity_1 = require("../../entities/auth-otp.entity");
const database_enum_1 = require("../common/enums/database.enum");
const user_service_1 = require("../user/user.service");
const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;
const RATE_LIMIT_MINUTES = 1;
function generateOtp() {
    const digits = crypto.randomInt(0, 1_000_000);
    return digits.toString().padStart(OTP_LENGTH, '0');
}
async function hashOtp(code) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await new Promise((resolve, reject) => {
        crypto.scrypt(code, salt, 64, (err, derived) => {
            if (err)
                reject(err);
            else
                resolve(derived);
        });
    });
    return `${salt}:${hash.toString('hex')}`;
}
async function verifyOtpHash(code, stored) {
    const [salt, hashHex] = stored.split(':');
    if (!salt || !hashHex)
        return false;
    const hash = await new Promise((resolve, reject) => {
        crypto.scrypt(code, salt, 64, (err, derived) => {
            if (err)
                reject(err);
            else
                resolve(derived);
        });
    });
    const storedBuf = Buffer.from(hashHex, 'hex');
    return crypto.timingSafeEqual(hash, storedBuf);
}
let AuthService = AuthService_1 = class AuthService {
    constructor(userService, authOtpRepository, jwt, config, mailer, settings) {
        this.userService = userService;
        this.authOtpRepository = authOtpRepository;
        this.jwt = jwt;
        this.config = config;
        this.mailer = mailer;
        this.settings = settings;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async login(dto) {
        const email = dto.email.toLowerCase().trim();
        const user = await this.userService.findOneByEmailForAuth(email);
        if (!user || !user.password) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const { otpEmailVerificationEnabled } = await this.settings.getPublic();
        if (otpEmailVerificationEnabled && !user.emailVerifiedAt) {
            throw new common_1.UnauthorizedException('Please verify your email before logging in');
        }
        const valid = await bcrypt.compare(dto.password, user.password);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const accessToken = await this.generateAccessToken(user.id, user.email, user.role);
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
    async register(dto) {
        const flags = await this.settings.getPublic();
        if (!flags.selfRegistrationEnabled) {
            throw new common_1.ForbiddenException('Self-service registration is disabled');
        }
        const email = dto.email.toLowerCase().trim();
        const existing = await this.userService.findOneByEmailInternal(email);
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 12);
        if (!flags.otpEmailVerificationEnabled) {
            await this.userService.createSelfRegisteredUser({
                email,
                name: dto.name.trim(),
                passwordHash: hashedPassword,
                role: database_enum_1.UserRole.TEACHER,
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
            role: database_enum_1.UserRole.TEACHER,
            verified: false,
        });
        await this.sendVerificationOtp(email, false);
        this.logger.log(`User registered: ${email} (pending verification)`);
        return { message: 'Check your email for the verification code' };
    }
    async verifyEmail(dto) {
        const email = dto.email.toLowerCase().trim();
        const hasCode = typeof dto.code === 'string' && /^\d{6}$/.test(dto.code);
        const hasToken = typeof dto.token === 'string' && dto.token.length >= 32;
        if (!hasCode && !hasToken) {
            throw new common_1.BadRequestException('Provide the 6-digit code or open the invite link from your email.');
        }
        const secret = (hasCode ? dto.code : dto.token);
        const candidates = await this.authOtpRepository.find({
            where: {
                email,
                consumedAt: (0, typeorm_2.IsNull)(),
                expiresAt: (0, typeorm_2.MoreThan)(new Date()),
            },
            order: { createdAt: 'DESC' },
        });
        let otp = null;
        for (const row of candidates) {
            if (await verifyOtpHash(secret, row.codeHash)) {
                otp = row;
                break;
            }
        }
        if (!otp) {
            throw new common_1.UnauthorizedException('Invalid or expired code. Please request a new one.');
        }
        otp.consumedAt = new Date();
        await this.authOtpRepository.save(otp);
        const user = await this.userService.findOneByEmailInternal(email);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const hashedPassword = dto.password ? await bcrypt.hash(dto.password, 12) : undefined;
        await this.userService.markEmailVerified(user.id, hashedPassword);
        const updated = await this.userService.findOneByEmailWithRelations(email, ['school', 'branch']);
        const accessToken = await this.generateAccessToken(updated.id, updated.email, updated.role);
        return {
            user: {
                id: updated.id,
                email: updated.email,
                name: updated.name,
                role: updated.role,
                schoolId: updated.schoolId,
                branchId: updated.branchId,
                school: updated.school,
                branch: updated.branch,
            },
            accessToken,
        };
    }
    async getProfile(userId) {
        const actor = { id: userId, role: database_enum_1.UserRole.ADMIN, schoolId: null, branchId: null };
        const user = await this.userService.getUserDetail(userId, actor);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        let ownerDirector = null;
        let ownerBranchDirector = null;
        if (user.role === database_enum_1.UserRole.TEACHER || user.role === database_enum_1.UserRole.STUDENT) {
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
    async sendVerificationOtp(email, requireUnverifiedUser = false) {
        const { otpEmailVerificationEnabled } = await this.settings.getPublic();
        if (!otpEmailVerificationEnabled) {
            throw new common_1.BadRequestException('Email verification codes are disabled on this system.');
        }
        const normalizedEmail = email.toLowerCase().trim();
        if (requireUnverifiedUser) {
            const user = await this.userService.findOneByEmailInternal(normalizedEmail);
            if (!user || user.emailVerifiedAt) {
                throw new common_1.UnauthorizedException('No pending verification found for this email');
            }
        }
        const recent = await this.authOtpRepository.findOne({
            where: {
                email: normalizedEmail,
                consumedAt: (0, typeorm_2.IsNull)(),
                expiresAt: (0, typeorm_2.MoreThan)(new Date()),
            },
            order: { createdAt: 'DESC' },
        });
        if (recent) {
            const elapsed = Date.now() - recent.createdAt.getTime();
            if (elapsed < RATE_LIMIT_MINUTES * 60 * 1000) {
                throw new common_1.BadRequestException(`Please wait ${RATE_LIMIT_MINUTES} minute(s) before requesting a new code`);
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
    async resendVerification(email) {
        await this.sendVerificationOtp(email, true);
    }
    async sendInviteOtp(email, inviterName) {
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
    async generateAccessToken(userId, email, role, expiryTime) {
        const finalExpiry = expiryTime || this.config.get('JWT_EXPIRATION') || '1d';
        const accessToken = await this.jwt.signAsync({ uuid: userId, sub: userId, email, role }, {
            secret: this.config.get('JWT_SECRET') || process.env.JWT_SECRET,
            subject: 'school',
            expiresIn: finalExpiry,
        });
        return accessToken;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_service_1.UserService))),
    __param(1, (0, typeorm_1.InjectRepository)(auth_otp_entity_1.AuthOtp)),
    __metadata("design:paramtypes", [user_service_1.UserService,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        mailer_service_1.MailerService,
        settings_service_1.SettingsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
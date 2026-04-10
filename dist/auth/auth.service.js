"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("node:crypto"));
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const mailer_service_js_1 = require("../mailer/mailer.service.js");
const settings_service_js_1 = require("../settings/settings.service.js");
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
    prisma;
    jwt;
    config;
    mailer;
    settings;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwt, config, mailer, settings) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.mailer = mailer;
        this.settings = settings;
    }
    async login(dto) {
        const email = dto.email.toLowerCase().trim();
        const user = await this.prisma.user.findFirst({
            where: { email, deletedAt: null },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                schoolId: true,
                branchId: true,
                password: true,
                emailVerifiedAt: true,
                school: { select: { id: true, name: true } },
                branch: { select: { id: true, name: true, schoolId: true } },
            },
        });
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
        const existing = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 12);
        if (!flags.otpEmailVerificationEnabled) {
            await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: dto.name.trim(),
                    role: 'TEACHER',
                    emailVerifiedAt: new Date(),
                },
            });
            this.logger.log(`User registered: ${email} (verified, no OTP)`);
            return {
                message: 'Account created. You can sign in now.',
                skipVerification: true,
            };
        }
        await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: dto.name.trim(),
                role: 'TEACHER',
                emailVerifiedAt: null,
            },
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
        const candidates = await this.prisma.authOtp.findMany({
            where: {
                email,
                consumedAt: null,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
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
        await this.prisma.authOtp.update({
            where: { id: otp.id },
            data: { consumedAt: new Date() },
        });
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const updateData = {
            emailVerifiedAt: new Date(),
        };
        if (dto.password) {
            updateData.password = await bcrypt.hash(dto.password, 12);
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: updateData,
        });
        const updated = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                schoolId: true,
                branchId: true,
                school: { select: { id: true, name: true } },
                branch: { select: { id: true, name: true, schoolId: true } },
            },
        });
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
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                authorities: true,
                schoolId: true,
                branchId: true,
                createdAt: true,
                emailVerifiedAt: true,
                staffPosition: true,
                staffClearanceActive: true,
                assignedBy: { select: { id: true, name: true, email: true } },
                directorProfile: { select: { officePhone: true, notes: true } },
                branchDirectorProfile: { select: { branchStartDate: true, notes: true } },
                teacherProfile: {
                    select: { subjectArea: true, employeeCode: true, joiningDate: true },
                },
                studentProfile: {
                    select: { rollNumber: true, guardianName: true, guardianPhone: true },
                },
                password: true,
                school: { select: { id: true, name: true } },
                branch: { select: { id: true, name: true, schoolId: true } },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        let ownerDirector = null;
        let ownerBranchDirector = null;
        if (user.role === client_1.UserRole.TEACHER || user.role === client_1.UserRole.STUDENT) {
            if (user.schoolId) {
                ownerDirector = await this.prisma.user.findFirst({
                    where: { role: client_1.UserRole.DIRECTOR, schoolId: user.schoolId },
                    select: { id: true, name: true, email: true },
                    orderBy: { createdAt: 'asc' },
                });
            }
            if (user.branchId) {
                ownerBranchDirector = await this.prisma.user.findFirst({
                    where: { role: client_1.UserRole.BRANCH_DIRECTOR, branchId: user.branchId },
                    select: { id: true, name: true, email: true },
                    orderBy: { createdAt: 'asc' },
                });
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
            const user = await this.prisma.user.findUnique({
                where: { email: normalizedEmail },
            });
            if (!user || user.emailVerifiedAt) {
                throw new common_1.UnauthorizedException('No pending verification found for this email');
            }
        }
        const recent = await this.prisma.authOtp.findFirst({
            where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
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
        await this.prisma.authOtp.create({
            data: { email: normalizedEmail, codeHash, expiresAt },
        });
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
        await this.prisma.authOtp.create({
            data: { email: normalizedEmail, codeHash, expiresAt },
        });
        await this.mailer.sendInvite(normalizedEmail, code, inviterName);
    }
    async generateAccessToken(userId, email, role) {
        const payload = { sub: userId, email, role };
        const expiresIn = this.config.get('JWT_EXPIRATION') ?? 604800;
        return this.jwt.signAsync(payload, { expiresIn });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mailer_service_js_1.MailerService,
        settings_service_js_1.SettingsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
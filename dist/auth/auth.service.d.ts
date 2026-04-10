import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailerService } from '../mailer/mailer.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { LoginDto, RegisterDto, VerifyEmailDto } from './dto/index.js';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly mailer;
    private readonly settings;
    private readonly logger;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, mailer: MailerService, settings: SettingsService);
    login(dto: LoginDto): Promise<{
        user: object;
        accessToken: string;
    }>;
    register(dto: RegisterDto): Promise<{
        message: string;
        skipVerification?: boolean;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        user: object;
        accessToken: string;
    }>;
    getProfile(userId: string): Promise<{
        ownerDirector: {
            id: string;
            name: string | null;
            email: string;
        } | null;
        ownerBranchDirector: {
            id: string;
            name: string | null;
            email: string;
        } | null;
        hasPassword: boolean;
        school: {
            name: string;
            id: string;
        } | null;
        branch: {
            name: string;
            id: string;
            schoolId: string;
        } | null;
        directorProfile: {
            notes: string | null;
            officePhone: string | null;
        } | null;
        branchDirectorProfile: {
            notes: string | null;
            branchStartDate: Date | null;
        } | null;
        teacherProfile: {
            subjectArea: string | null;
            employeeCode: string | null;
            joiningDate: Date | null;
        } | null;
        studentProfile: {
            rollNumber: string | null;
            guardianName: string | null;
            guardianPhone: string | null;
        } | null;
        name: string | null;
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        authorities: import("@prisma/client").$Enums.UserRole[];
        schoolId: string | null;
        branchId: string | null;
        staffPosition: import("@prisma/client").$Enums.StaffPosition | null;
        staffClearanceActive: boolean;
        emailVerifiedAt: Date | null;
        createdAt: Date;
        assignedBy: {
            name: string | null;
            id: string;
            email: string;
        } | null;
    }>;
    sendVerificationOtp(email: string, requireUnverifiedUser?: boolean): Promise<void>;
    resendVerification(email: string): Promise<void>;
    sendInviteOtp(email: string, inviterName?: string): Promise<void>;
    private generateAccessToken;
}

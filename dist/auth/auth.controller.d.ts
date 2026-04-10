import { AuthService } from './auth.service.js';
import { LoginDto, RegisterDto, VerifyEmailDto } from './dto/index.js';
interface RequestUser {
    id: string;
    email: string;
    role: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    resendVerification(body: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    me(user: RequestUser): Promise<{
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
    logout(): {
        message: string;
    };
}
export {};

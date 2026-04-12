import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, VerifyEmailDto } from './dto/index';
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
        email: string;
        name: string | null;
        phone: string | null;
        role: import("../common/enums/database.enum").UserRole;
        authorities: import("../common/enums/database.enum").UserRole[];
        schoolId: string | null;
        branchId: string | null;
        assignedById: string | null;
        staffPosition: import("../common/enums/database.enum").StaffPosition | null;
        staffClearanceActive: boolean;
        emailVerifiedAt: Date | null;
        deletedBy: string | null;
        school: import("../../entities/school.entity").School;
        branch: import("../../entities/branch.entity").Branch;
        assignedBy: import("../../entities/user.entity").User;
        assignedUsers: import("../../entities/user.entity").User[];
        directorProfile: import("../../entities/director-profile.entity").DirectorProfile;
        branchDirectorProfile: import("../../entities/branch-director-profile.entity").BranchDirectorProfile;
        teacherProfile: import("../../entities/teacher-profile.entity").TeacherProfile;
        studentProfile: import("../../entities/student-profile.entity").StudentProfile;
        parentProfile: import("../../entities/parent-profile.entity").ParentProfile;
        eligibilityProfile: import("../../entities/teacher-eligibility-profile.entity").TeacherEligibilityProfile;
        studentLinks: import("../../entities/student-parent.entity").StudentParent[];
        parentLinks: import("../../entities/student-parent.entity").StudentParent[];
        documents: import("../../entities/document.entity").Document[];
        uploadedDocuments: import("../../entities/document.entity").Document[];
        requiredDocTypes: import("../../entities/document.entity").DocumentType[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt?: Date | null;
    }>;
    logout(): {
        message: string;
    };
}
export {};

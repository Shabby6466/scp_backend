import { Repository } from 'typeorm';
import { Branch } from '../../entities/branch.entity';
import { UserRole } from '../common/enums/database.enum';
import { UserService } from '../user/user.service';
import { DocumentService } from '../document/document.service';
export declare const NEAR_EXPIRY_DAYS = 30;
type CurrentUser = {
    id: string;
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
};
export declare class BranchDashboardService {
    private readonly branchRepository;
    private readonly userService;
    private readonly documentService;
    constructor(branchRepository: Repository<Branch>, userService: UserService, documentService: DocumentService);
    ensureBranchDashboardAccess(branchId: string, user: CurrentUser): Promise<Branch>;
    getDashboardSummary(branchId: string, user: CurrentUser): Promise<{
        branchId: string;
        schoolId: string;
        studentCount: number;
        teacherCount: number;
        teachersConsidered: number;
        teachersWithAllRequiredForms: number;
        formsNearExpiryCount: number;
        compliance: {
            requiredSlots: number;
            satisfiedSlots: number;
            missingSlots: number;
        };
    }>;
    getRecentDocuments(branchId: string, user: CurrentUser, limit?: number): Promise<{
        id: string;
        formRef: string;
        fileName: string;
        documentTypeName: string;
        category: UserRole;
        issuedAt: string | null;
        expiresAt: string | null;
        createdAt: string;
        addedBy: {
            id: string;
            name: string | null;
            email: string;
        };
    }[]>;
    getCompliancePeople(branchId: string, user: CurrentUser): Promise<{
        students: {
            kind: "STUDENT";
            userId: string;
            name: string;
            guardianName: string | null;
            guardianEmail: string;
            requiredCount: number;
            uploadedSatisfiedCount: number;
            missingCount: number;
        }[];
        teachers: {
            kind: "TEACHER";
            userId: string;
            name: string;
            email: string;
            requiredCount: number;
            uploadedSatisfiedCount: number;
            missingCount: number;
        }[];
    }>;
    private isDocCurrentlyValid;
    private isNearExpiry;
}
export {};

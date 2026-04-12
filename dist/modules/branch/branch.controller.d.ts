import { BranchService } from './branch.service';
import { BranchDashboardService } from './branch-dashboard.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UserRole } from '../common/enums/database.enum';
export declare class BranchController {
    private readonly branchService;
    private readonly branchDashboardService;
    constructor(branchService: BranchService, branchDashboardService: BranchDashboardService);
    create(schoolId: string, dto: CreateBranchDto, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/branch.entity").Branch>;
    findAllBySchool(schoolId: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/branch.entity").Branch[]>;
    dashboardSummary(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    recentDocuments(id: string, limit: number, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    compliancePeople(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    findOne(id: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/branch.entity").Branch>;
    listTeachers(id: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/user.entity").User[]>;
    update(id: string, dto: UpdateBranchDto, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/branch.entity").Branch | null>;
    remove(id: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/branch.entity").Branch>;
}

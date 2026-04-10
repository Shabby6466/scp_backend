import { BranchService } from './branch.service.js';
import { BranchDashboardService } from './branch-dashboard.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { UserRole } from '@prisma/client';
export declare class BranchController {
    private readonly branchService;
    private readonly branchDashboardService;
    constructor(branchService: BranchService, branchDashboardService: BranchDashboardService);
    create(schoolId: string, dto: CreateBranchDto, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        schoolId: string;
        deletedAt: Date | null;
        deletedBy: string | null;
        createdAt: Date;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        minAge: number | null;
        maxAge: number | null;
        totalCapacity: number | null;
        isPrimary: boolean;
        isActive: boolean;
        notes: string | null;
    }>;
    findAllBySchool(schoolId: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        schoolId: string;
        deletedAt: Date | null;
        deletedBy: string | null;
        createdAt: Date;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        minAge: number | null;
        maxAge: number | null;
        totalCapacity: number | null;
        isPrimary: boolean;
        isActive: boolean;
        notes: string | null;
    }[]>;
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
        category: import("@prisma/client").$Enums.UserRole;
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
    }): Promise<{
        school: {
            name: string;
            id: string;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            deletedAt: Date | null;
            deletedBy: string | null;
            createdAt: Date;
            address: string | null;
            city: string | null;
            state: string | null;
            zipCode: string | null;
            website: string | null;
            licenseNumber: string | null;
            certificationNumber: string | null;
            minAge: number | null;
            maxAge: number | null;
            totalCapacity: number | null;
            primaryColor: string | null;
            logoUrl: string | null;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
        };
        users: {
            name: string | null;
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
        }[];
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        schoolId: string;
        deletedAt: Date | null;
        deletedBy: string | null;
        createdAt: Date;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        minAge: number | null;
        maxAge: number | null;
        totalCapacity: number | null;
        isPrimary: boolean;
        isActive: boolean;
        notes: string | null;
    }>;
    listTeachers(id: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        branch: {
            name: string;
            id: string;
            schoolId: string;
        } | null;
        name: string | null;
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        schoolId: string | null;
        branchId: string | null;
        staffPosition: import("@prisma/client").$Enums.StaffPosition | null;
        staffClearanceActive: boolean;
        createdAt: Date;
    }[]>;
    update(id: string, dto: UpdateBranchDto, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        school: {
            name: string;
            id: string;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            deletedAt: Date | null;
            deletedBy: string | null;
            createdAt: Date;
            address: string | null;
            city: string | null;
            state: string | null;
            zipCode: string | null;
            website: string | null;
            licenseNumber: string | null;
            certificationNumber: string | null;
            minAge: number | null;
            maxAge: number | null;
            totalCapacity: number | null;
            primaryColor: string | null;
            logoUrl: string | null;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
        };
        users: {
            name: string | null;
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
        }[];
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        schoolId: string;
        deletedAt: Date | null;
        deletedBy: string | null;
        createdAt: Date;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        minAge: number | null;
        maxAge: number | null;
        totalCapacity: number | null;
        isPrimary: boolean;
        isActive: boolean;
        notes: string | null;
    }>;
    remove(id: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        schoolId: string;
        deletedAt: Date | null;
        deletedBy: string | null;
        createdAt: Date;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        minAge: number | null;
        maxAge: number | null;
        totalCapacity: number | null;
        isPrimary: boolean;
        isActive: boolean;
        notes: string | null;
    }>;
}

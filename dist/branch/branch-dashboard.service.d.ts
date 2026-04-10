import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
export declare const NEAR_EXPIRY_DAYS = 30;
type CurrentUser = {
    id: string;
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
};
export declare class BranchDashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    ensureBranchDashboardAccess(branchId: string, user: CurrentUser): Promise<{
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
}
export {};

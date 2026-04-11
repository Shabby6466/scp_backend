import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSchoolDto } from './dto/create-school.dto.js';
import { UpdateSchoolDto } from './dto/update-school.dto.js';
import { BranchDashboardService } from '../branch/branch-dashboard.service.js';
type DashboardUser = {
    id: string;
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
};
export declare class SchoolService {
    private readonly prisma;
    private readonly branchDashboardService;
    constructor(prisma: PrismaService, branchDashboardService: BranchDashboardService);
    create(dto: CreateSchoolDto): Promise<{
        _count: {
            users: number;
            branches: number;
        };
    } & {
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
    }>;
    findAll(user: {
        role: UserRole;
        schoolId: string | null;
    }): Promise<({
        _count: {
            users: number;
            branches: number;
        };
    } & {
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
    })[]>;
    findOne(id: string, user: {
        role: UserRole;
        schoolId: string | null;
    }): Promise<{
        _count: {
            users: number;
            branches: number;
        };
        users: {
            name: string | null;
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            createdAt: Date;
        }[];
    } & {
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
    }>;
    update(id: string, dto: UpdateSchoolDto, user?: {
        role: UserRole;
        schoolId: string | null;
    }): Promise<{
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
    }>;
    remove(id: string): Promise<{
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
    }>;
    getDashboardSummary(id: string, user: DashboardUser): Promise<{
        name: string;
        stats: {
            pendingDocs: number;
            expiringDocs: number;
            studentCount: number;
            teacherCount: number;
            parentCount: number;
        };
    }>;
    listComplianceRequirements(id: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<({
        inspectionType: {
            name: string;
            id: string;
            frequency: string | null;
        } | null;
        createdBy: {
            name: string | null;
            id: string;
            email: string;
        } | null;
        owner: {
            name: string | null;
            id: string;
            email: string;
        } | null;
    } & {
        tags: string[];
        id: string;
        updatedAt: Date;
        schoolId: string;
        createdAt: Date;
        description: string | null;
        createdById: string | null;
        ownerUserId: string | null;
        status: string;
        inspectionTypeId: string | null;
        title: string;
        frequency: string | null;
        intervalValue: number | null;
        riskLevel: string | null;
        dueDate: Date | null;
        nextDueDate: Date | null;
        lastCompletedAt: Date | null;
        evidenceRequired: boolean;
        requiresReview: boolean;
    })[]>;
    listInspectionTypes(id: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        schoolId: string;
        createdAt: Date;
        isActive: boolean;
        description: string | null;
        frequency: string | null;
    }[]>;
    listCertificationRecords(id: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<({
        certificationType: {
            name: string;
            id: string;
            defaultValidityMonths: number | null;
        };
    } & {
        id: string;
        updatedAt: Date;
        schoolId: string;
        createdAt: Date;
        notes: string | null;
        ownerUserId: string | null;
        status: string;
        certificationTypeId: string;
        appliesTo: string | null;
        subjectId: string | null;
        subjectName: string | null;
        issuedDate: Date | null;
        expiryDate: Date | null;
    })[]>;
}
export {};

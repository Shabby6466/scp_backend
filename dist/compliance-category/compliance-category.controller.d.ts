import { ComplianceCategoryService } from './compliance-category.service.js';
import { UserRole } from '@prisma/client';
import { CreateComplianceCategoryDto } from './dto/create-compliance-category.dto.js';
import { UpdateComplianceCategoryDto } from './dto/update-compliance-category.dto.js';
export declare class ComplianceCategoryController {
    private readonly complianceCategoryService;
    constructor(complianceCategoryService: ComplianceCategoryService);
    create(user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }, dto: CreateComplianceCategoryDto): Promise<{
        school: {
            name: string;
            id: string;
        };
        _count: {
            documentTypes: number;
        };
        createdBy: {
            name: string | null;
            id: string;
            email: string;
        };
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        schoolId: string;
        createdAt: Date;
        description: string | null;
        sortOrder: number;
        createdById: string;
        slug: string;
        icon: string | null;
    }>;
    findAll(user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }, schoolId?: string): Promise<({
        school: {
            name: string;
            id: string;
        };
        _count: {
            documentTypes: number;
        };
        createdBy: {
            name: string | null;
            id: string;
            email: string;
        };
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        schoolId: string;
        createdAt: Date;
        description: string | null;
        sortOrder: number;
        createdById: string;
        slug: string;
        icon: string | null;
    })[]>;
    findBySlug(slug: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        school: {
            name: string;
            id: string;
        };
        _count: {
            documentTypes: number;
        };
        createdBy: {
            name: string | null;
            id: string;
            email: string;
        };
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        schoolId: string;
        createdAt: Date;
        description: string | null;
        sortOrder: number;
        createdById: string;
        slug: string;
        icon: string | null;
    }>;
    findOne(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        school: {
            name: string;
            id: string;
        };
        _count: {
            documentTypes: number;
        };
        createdBy: {
            name: string | null;
            id: string;
            email: string;
        };
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        schoolId: string;
        createdAt: Date;
        description: string | null;
        sortOrder: number;
        createdById: string;
        slug: string;
        icon: string | null;
    }>;
    getScore(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        categoryId: string;
        categoryName: string;
        categorySlug: string;
        totalSlots: number;
        satisfiedSlots: number;
        score: number;
        expiringSoon: number;
        expired: number;
        byRole: Record<string, {
            total: number;
            satisfied: number;
        }>;
    }>;
    update(id: string, dto: UpdateComplianceCategoryDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        school: {
            name: string;
            id: string;
        };
        _count: {
            documentTypes: number;
        };
        createdBy: {
            name: string | null;
            id: string;
            email: string;
        };
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        schoolId: string;
        createdAt: Date;
        description: string | null;
        sortOrder: number;
        createdById: string;
        slug: string;
        icon: string | null;
    }>;
    delete(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        deleted: boolean;
    }>;
}

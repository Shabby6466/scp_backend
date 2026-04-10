import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateComplianceCategoryDto } from './dto/create-compliance-category.dto.js';
import { UpdateComplianceCategoryDto } from './dto/update-compliance-category.dto.js';
type CurrentUser = {
    id: string;
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
};
export declare class ComplianceCategoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateComplianceCategoryDto, user: CurrentUser): Promise<{
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
        sortOrder: number;
        description: string | null;
        createdById: string;
        slug: string;
        icon: string | null;
    }>;
    update(id: string, dto: UpdateComplianceCategoryDto, user: CurrentUser): Promise<{
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
        sortOrder: number;
        description: string | null;
        createdById: string;
        slug: string;
        icon: string | null;
    }>;
    delete(id: string, user: CurrentUser): Promise<{
        deleted: boolean;
    }>;
    findAll(user: CurrentUser, schoolId?: string): Promise<({
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
        sortOrder: number;
        description: string | null;
        createdById: string;
        slug: string;
        icon: string | null;
    })[]>;
    findOne(id: string, user: CurrentUser): Promise<{
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
        sortOrder: number;
        description: string | null;
        createdById: string;
        slug: string;
        icon: string | null;
    }>;
    findBySlug(slug: string, user: CurrentUser): Promise<{
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
        sortOrder: number;
        description: string | null;
        createdById: string;
        slug: string;
        icon: string | null;
    }>;
    getScore(id: string, user: CurrentUser): Promise<{
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
    private assertAccess;
}
export {};

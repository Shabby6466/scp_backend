import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto.js';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto.js';
import { MailerService } from '../mailer/mailer.service.js';
type CurrentUser = {
    id: string;
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
};
export declare class DocumentTypeService {
    private readonly prisma;
    private readonly mailer;
    constructor(prisma: PrismaService, mailer: MailerService);
    private canAssignRole;
    private assertActorCanAccessDocType;
    private ensureScope;
    create(dto: CreateDocumentTypeDto, user: CurrentUser): Promise<{
        school: {
            name: string;
            id: string;
        } | null;
        branch: {
            name: string;
            id: string;
        } | null;
        complianceCategory: {
            name: string;
            id: string;
            slug: string;
        } | null;
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        schoolId: string | null;
        branchId: string | null;
        createdAt: Date;
        isActive: boolean;
        targetRole: import("@prisma/client").$Enums.UserRole;
        category: string | null;
        description: string | null;
        isMandatory: boolean;
        renewalPeriod: import("@prisma/client").$Enums.RenewalPeriod;
        sortOrder: number;
        appliesToAgeMin: number | null;
        appliesToAgeMax: number | null;
        complianceCategoryId: string | null;
        createdById: string;
    }>;
    update(id: string, dto: UpdateDocumentTypeDto, user: CurrentUser): Promise<{
        school: {
            name: string;
            id: string;
        } | null;
        branch: {
            name: string;
            id: string;
        } | null;
        complianceCategory: {
            name: string;
            id: string;
            slug: string;
        } | null;
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        schoolId: string | null;
        branchId: string | null;
        createdAt: Date;
        isActive: boolean;
        targetRole: import("@prisma/client").$Enums.UserRole;
        category: string | null;
        description: string | null;
        isMandatory: boolean;
        renewalPeriod: import("@prisma/client").$Enums.RenewalPeriod;
        sortOrder: number;
        appliesToAgeMin: number | null;
        appliesToAgeMax: number | null;
        complianceCategoryId: string | null;
        createdById: string;
    }>;
    assignUsers(documentTypeId: string, userIds: string[], user: CurrentUser): Promise<{
        requiredUsers: {
            name: string | null;
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            schoolId: string | null;
            branchId: string | null;
        }[];
        name: string;
        id: string;
        schoolId: string | null;
        branchId: string | null;
        targetRole: import("@prisma/client").$Enums.UserRole;
    }>;
    unassignUser(documentTypeId: string, userId: string, user: CurrentUser): Promise<{
        requiredUsers: {
            name: string | null;
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            schoolId: string | null;
            branchId: string | null;
        }[];
        name: string;
        id: string;
        schoolId: string | null;
        branchId: string | null;
        targetRole: import("@prisma/client").$Enums.UserRole;
    }>;
    getAssignedForCurrentUser(user: CurrentUser): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        schoolId: string | null;
        branchId: string | null;
        createdAt: Date;
        isActive: boolean;
        targetRole: import("@prisma/client").$Enums.UserRole;
        category: string | null;
        description: string | null;
        isMandatory: boolean;
        renewalPeriod: import("@prisma/client").$Enums.RenewalPeriod;
        sortOrder: number;
        appliesToAgeMin: number | null;
        appliesToAgeMax: number | null;
        complianceCategoryId: string | null;
        createdById: string;
    }[]>;
    getAssignees(documentTypeId: string, user: CurrentUser): Promise<{
        requiredUsers: {
            name: string | null;
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            schoolId: string | null;
            branchId: string | null;
        }[];
        name: string;
        id: string;
        schoolId: string | null;
        branchId: string | null;
        targetRole: import("@prisma/client").$Enums.UserRole;
    }>;
    findAll(filters: {
        schoolId?: string;
        branchId?: string;
        targetRole?: UserRole;
    }, user: CurrentUser): Promise<({
        school: {
            name: string;
            id: string;
        } | null;
        branch: {
            name: string;
            id: string;
        } | null;
        complianceCategory: {
            name: string;
            id: string;
            slug: string;
        } | null;
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        schoolId: string | null;
        branchId: string | null;
        createdAt: Date;
        isActive: boolean;
        targetRole: import("@prisma/client").$Enums.UserRole;
        category: string | null;
        description: string | null;
        isMandatory: boolean;
        renewalPeriod: import("@prisma/client").$Enums.RenewalPeriod;
        sortOrder: number;
        appliesToAgeMin: number | null;
        appliesToAgeMax: number | null;
        complianceCategoryId: string | null;
        createdById: string;
    })[]>;
    findOne(id: string, user: CurrentUser): Promise<{
        school: {
            name: string;
            id: string;
        } | null;
        branch: {
            name: string;
            id: string;
        } | null;
        complianceCategory: {
            name: string;
            id: string;
            slug: string;
        } | null;
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        schoolId: string | null;
        branchId: string | null;
        createdAt: Date;
        isActive: boolean;
        targetRole: import("@prisma/client").$Enums.UserRole;
        category: string | null;
        description: string | null;
        isMandatory: boolean;
        renewalPeriod: import("@prisma/client").$Enums.RenewalPeriod;
        sortOrder: number;
        appliesToAgeMin: number | null;
        appliesToAgeMax: number | null;
        complianceCategoryId: string | null;
        createdById: string;
    }>;
}
export {};

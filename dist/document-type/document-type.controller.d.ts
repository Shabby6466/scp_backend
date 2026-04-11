import { DocumentTypeService } from './document-type.service.js';
import { UserRole } from '@prisma/client';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto.js';
import { AssignDocumentTypeDto } from './dto/assign-document-type.dto.js';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto.js';
export declare class DocumentTypeController {
    private readonly documentTypeService;
    constructor(documentTypeService: DocumentTypeService);
    create(user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }, dto: CreateDocumentTypeDto): Promise<{
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
    assignUsers(id: string, dto: AssignDocumentTypeDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    unassignUser(id: string, userId: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    assignedToMe(user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    assignees(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    findAll(user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }, schoolId?: string, branchId?: string, targetRole?: UserRole): Promise<({
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
    update(id: string, dto: UpdateDocumentTypeDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    findOne(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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

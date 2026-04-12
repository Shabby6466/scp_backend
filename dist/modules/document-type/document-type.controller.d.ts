import { DocumentTypeService } from './document-type.service';
import { UserRole } from '../common/enums/database.enum';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { AssignDocumentTypeDto } from './dto/assign-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';
export declare class DocumentTypeController {
    private readonly documentTypeService;
    constructor(documentTypeService: DocumentTypeService);
    create(user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }, dto: CreateDocumentTypeDto): Promise<import("../../entities/document.entity").DocumentType>;
    assignUsers(id: string, dto: AssignDocumentTypeDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        requiredUsers: import("../../entities/user.entity").User[];
        name: string;
        targetRole: UserRole;
        isMandatory: boolean;
        renewalPeriod: import("../common/enums/database.enum").RenewalPeriod;
        sortOrder: number;
        schoolId: string | null;
        branchId: string | null;
        createdById: string | null;
        categoryId: string | null;
        category: import("../../entities/compliance-category.entity").ComplianceCategory | null;
        documents: import("../../entities/document.entity").Document[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt?: Date | null;
    }>;
    unassignUser(id: string, userId: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        requiredUsers: import("../../entities/user.entity").User[];
        name: string;
        targetRole: UserRole;
        isMandatory: boolean;
        renewalPeriod: import("../common/enums/database.enum").RenewalPeriod;
        sortOrder: number;
        schoolId: string | null;
        branchId: string | null;
        createdById: string | null;
        categoryId: string | null;
        category: import("../../entities/compliance-category.entity").ComplianceCategory | null;
        documents: import("../../entities/document.entity").Document[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt?: Date | null;
    }>;
    assignedToMe(user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/document.entity").DocumentType[]>;
    assignees(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        requiredUsers: import("../../entities/user.entity").User[];
        name: string;
        targetRole: UserRole;
        isMandatory: boolean;
        renewalPeriod: import("../common/enums/database.enum").RenewalPeriod;
        sortOrder: number;
        schoolId: string | null;
        branchId: string | null;
        createdById: string | null;
        categoryId: string | null;
        category: import("../../entities/compliance-category.entity").ComplianceCategory | null;
        documents: import("../../entities/document.entity").Document[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt?: Date | null;
    }>;
    findAll(user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }, schoolId?: string, branchId?: string, targetRole?: UserRole): Promise<import("../../entities/document.entity").DocumentType[]>;
    update(id: string, dto: UpdateDocumentTypeDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/document.entity").DocumentType>;
    findOne(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/document.entity").DocumentType>;
}

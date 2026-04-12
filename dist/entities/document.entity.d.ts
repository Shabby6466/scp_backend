import { BaseEntity } from './base.entity';
import { UserRole, RenewalPeriod } from '../modules/common/enums/database.enum';
import { User } from './user.entity';
import { ComplianceCategory } from './compliance-category.entity';
export declare class DocumentType extends BaseEntity {
    name: string;
    targetRole: UserRole;
    isMandatory: boolean;
    renewalPeriod: RenewalPeriod;
    sortOrder: number;
    schoolId: string | null;
    branchId: string | null;
    createdById: string | null;
    categoryId: string | null;
    category: ComplianceCategory | null;
    documents: Document[];
    requiredUsers: User[];
}
export declare class Document extends BaseEntity {
    ownerUserId: string;
    documentTypeId: string;
    fileName: string;
    s3Key: string;
    mimeType: string | null;
    sizeBytes: number | null;
    issuedAt: Date | null;
    expiresAt: Date | null;
    verifiedAt: Date | null;
    uploadedByUserId: string;
    ownerUser: User;
    documentType: DocumentType;
    uploadedBy: User;
}

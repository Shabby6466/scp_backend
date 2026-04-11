import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { PresignDto } from './dto/presign.dto.js';
import { CompleteDocumentDto } from './dto/complete.dto.js';
import { MailerService } from '../mailer/mailer.service.js';
import { SearchDocumentDto } from './dto/search-document.dto.js';
type CurrentUser = {
    id: string;
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
};
export declare class DocumentService {
    private readonly prisma;
    private readonly storage;
    private readonly mailer;
    private readonly logger;
    constructor(prisma: PrismaService, storage: StorageService, mailer: MailerService);
    presign(dto: PresignDto, user: CurrentUser): Promise<{
        uploadUrl: string;
        s3Key: string;
        uploadToken?: string;
    }>;
    complete(dto: CompleteDocumentDto, user: CurrentUser): Promise<{
        documentType: {
            name: string;
            id: string;
            targetRole: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        deletedAt: Date | null;
        deletedBy: string | null;
        createdAt: Date;
        notes: string | null;
        expiresAt: Date | null;
        ownerUserId: string;
        documentTypeId: string;
        uploadedById: string;
        s3Key: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        status: import("@prisma/client").$Enums.DocumentStatus;
        issuedAt: Date | null;
        verifiedAt: Date | null;
        reviewedAt: Date | null;
        reviewedById: string | null;
        rejectionReason: string | null;
    }>;
    listByOwner(ownerUserId: string, user: CurrentUser): Promise<({
        documentType: {
            name: string;
            id: string;
            targetRole: import("@prisma/client").$Enums.UserRole;
            isMandatory: boolean;
            renewalPeriod: import("@prisma/client").$Enums.RenewalPeriod;
        };
    } & {
        id: string;
        deletedAt: Date | null;
        deletedBy: string | null;
        createdAt: Date;
        notes: string | null;
        expiresAt: Date | null;
        ownerUserId: string;
        documentTypeId: string;
        uploadedById: string;
        s3Key: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        status: import("@prisma/client").$Enums.DocumentStatus;
        issuedAt: Date | null;
        verifiedAt: Date | null;
        reviewedAt: Date | null;
        reviewedById: string | null;
        rejectionReason: string | null;
    })[]>;
    searchDocuments(dto: SearchDocumentDto, user: CurrentUser): Promise<({
        documentType: {
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
        };
        ownerUser: {
            name: string | null;
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            branchId: string | null;
        };
    } & {
        id: string;
        deletedAt: Date | null;
        deletedBy: string | null;
        createdAt: Date;
        notes: string | null;
        expiresAt: Date | null;
        ownerUserId: string;
        documentTypeId: string;
        uploadedById: string;
        s3Key: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        status: import("@prisma/client").$Enums.DocumentStatus;
        issuedAt: Date | null;
        verifiedAt: Date | null;
        reviewedAt: Date | null;
        reviewedById: string | null;
        rejectionReason: string | null;
    })[]>;
    getSummaryForOwner(ownerUserId: string, user: CurrentUser): Promise<{
        assignedCount: number;
        uploadedCount: number;
        remainingCount: number;
        items: {
            documentType: {
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
            };
            latestDocument: ({
                documentType: {
                    name: string;
                    id: string;
                    isMandatory: boolean;
                    renewalPeriod: import("@prisma/client").$Enums.RenewalPeriod;
                };
            } & {
                id: string;
                deletedAt: Date | null;
                deletedBy: string | null;
                createdAt: Date;
                notes: string | null;
                expiresAt: Date | null;
                ownerUserId: string;
                documentTypeId: string;
                uploadedById: string;
                s3Key: string;
                fileName: string;
                mimeType: string;
                sizeBytes: number;
                status: import("@prisma/client").$Enums.DocumentStatus;
                issuedAt: Date | null;
                verifiedAt: Date | null;
                reviewedAt: Date | null;
                reviewedById: string | null;
                rejectionReason: string | null;
            }) | null;
            remainingDays: number | null;
        }[];
    }>;
    getAssignedSummary(user: CurrentUser): Promise<{
        assignedCount: number;
        uploadedCount: number;
        remainingCount: number;
        items: {
            documentType: {
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
            };
            latestDocument: ({
                documentType: {
                    name: string;
                    id: string;
                    isMandatory: boolean;
                    renewalPeriod: import("@prisma/client").$Enums.RenewalPeriod;
                };
            } & {
                id: string;
                deletedAt: Date | null;
                deletedBy: string | null;
                createdAt: Date;
                notes: string | null;
                expiresAt: Date | null;
                ownerUserId: string;
                documentTypeId: string;
                uploadedById: string;
                s3Key: string;
                fileName: string;
                mimeType: string;
                sizeBytes: number;
                status: import("@prisma/client").$Enums.DocumentStatus;
                issuedAt: Date | null;
                verifiedAt: Date | null;
                reviewedAt: Date | null;
                reviewedById: string | null;
                rejectionReason: string | null;
            }) | null;
            remainingDays: number | null;
        }[];
    }>;
    getPerFormDetail(ownerUserId: string, documentTypeId: string, user: CurrentUser): Promise<{
        owner: {
            id: string;
            name: string | null;
            email: string;
        };
        documentType: {
            name: string;
            id: string;
            targetRole: import("@prisma/client").$Enums.UserRole;
            renewalPeriod: import("@prisma/client").$Enums.RenewalPeriod;
        };
        latestDocument: {
            id: string;
            deletedAt: Date | null;
            deletedBy: string | null;
            createdAt: Date;
            notes: string | null;
            expiresAt: Date | null;
            ownerUserId: string;
            documentTypeId: string;
            uploadedById: string;
            s3Key: string;
            fileName: string;
            mimeType: string;
            sizeBytes: number;
            status: import("@prisma/client").$Enums.DocumentStatus;
            issuedAt: Date | null;
            verifiedAt: Date | null;
            reviewedAt: Date | null;
            reviewedById: string | null;
            rejectionReason: string | null;
        };
        uploadedDate: Date;
        dueDate: Date | null;
        remainingDays: number | null;
    }>;
    verify(documentId: string, user: CurrentUser): Promise<{
        documentType: {
            name: string;
            id: string;
            targetRole: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        deletedAt: Date | null;
        deletedBy: string | null;
        createdAt: Date;
        notes: string | null;
        expiresAt: Date | null;
        ownerUserId: string;
        documentTypeId: string;
        uploadedById: string;
        s3Key: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        status: import("@prisma/client").$Enums.DocumentStatus;
        issuedAt: Date | null;
        verifiedAt: Date | null;
        reviewedAt: Date | null;
        reviewedById: string | null;
        rejectionReason: string | null;
    }>;
    verifyMany(documentIds: string[], user: CurrentUser): Promise<{
        count: number;
        total: number;
    }>;
    nudge(ownerUserId: string, documentTypeId: string, user: CurrentUser): Promise<{
        success: boolean;
    }>;
    private syncTeacherClearanceFromVerifiedDocs;
    findDocumentById(documentId: string, user: CurrentUser): Promise<{
        documentType: {
            name: string;
            id: string;
            targetRole: import("@prisma/client").$Enums.UserRole;
            renewalPeriod: import("@prisma/client").$Enums.RenewalPeriod;
        };
        ownerUser: {
            name: string | null;
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        uploadedBy: {
            name: string | null;
            id: string;
            email: string;
        };
    } & {
        id: string;
        deletedAt: Date | null;
        deletedBy: string | null;
        createdAt: Date;
        notes: string | null;
        expiresAt: Date | null;
        ownerUserId: string;
        documentTypeId: string;
        uploadedById: string;
        s3Key: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        status: import("@prisma/client").$Enums.DocumentStatus;
        issuedAt: Date | null;
        verifiedAt: Date | null;
        reviewedAt: Date | null;
        reviewedById: string | null;
        rejectionReason: string | null;
    }>;
    getDownloadUrl(documentId: string, user: CurrentUser): Promise<string>;
    exportPerFormPdf(ownerUserId: string, documentTypeId: string, user: CurrentUser): Promise<{
        buffer: Buffer<ArrayBufferLike>;
        fileName: string;
    }>;
    private resolveOwnerScope;
    private ensureCanAccessDocumentOwner;
    private ensureCanManageBranch;
}
export {};

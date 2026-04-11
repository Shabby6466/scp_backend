import { StreamableFile } from '@nestjs/common';
import { DocumentService } from './document.service.js';
import { PresignDto } from './dto/presign.dto.js';
import { CompleteDocumentDto } from './dto/complete.dto.js';
import { SearchDocumentDto } from './dto/search-document.dto.js';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
export declare class DocumentController {
    private readonly documentService;
    constructor(documentService: DocumentService);
    searchDocuments(dto: SearchDocumentDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<({
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
    presign(dto: PresignDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        uploadUrl: string;
        s3Key: string;
        uploadToken?: string;
    }>;
    complete(dto: CompleteDocumentDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    listByStaff(staffId: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<({
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
    listByOwner(ownerUserId: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<({
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
    getAssignedSummary(user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    getPerFormDetail(ownerUserId: string, documentTypeId: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    exportPerFormPdf(ownerUserId: string, documentTypeId: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }, res: Response): Promise<StreamableFile>;
    summaryForOwner(ownerUserId: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    perFormForOwner(ownerUserId: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    getDownloadUrlAlias(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        url: string;
    }>;
    getDocumentById(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    verify(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    getDownloadUrl(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<string>;
    verifyMany(ids: string[], user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        count: number;
        total: number;
    }>;
    nudge(ownerUserId: string, documentTypeId: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        success: boolean;
    }>;
}

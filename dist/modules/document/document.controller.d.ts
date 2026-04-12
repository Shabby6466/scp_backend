import { StreamableFile } from '@nestjs/common';
import { DocumentService } from './document.service';
import { PresignDto } from './dto/presign.dto';
import { CompleteDocumentDto } from './dto/complete.dto';
import { SearchDocumentDto } from './dto/search-document.dto';
import { UserRole } from '../common/enums/database.enum';
import type { Response } from 'express';
export declare class DocumentController {
    private readonly documentService;
    constructor(documentService: DocumentService);
    searchDocuments(dto: SearchDocumentDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/document.entity").Document[]>;
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
    }): Promise<import("../../entities/document.entity").Document | null>;
    listByStaff(staffId: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/document.entity").Document[]>;
    listByOwner(ownerUserId: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/document.entity").Document[]>;
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
            documentType: import("../../entities/document.entity").DocumentType;
            latestDocument: import("../../entities/document.entity").Document | null;
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
        documentType: import("../../entities/document.entity").DocumentType | null;
        latestDocument: import("../../entities/document.entity").Document | null;
        uploadedDate: Date | null;
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
            documentType: import("../../entities/document.entity").DocumentType;
            latestDocument: import("../../entities/document.entity").Document | null;
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
            documentType: import("../../entities/document.entity").DocumentType;
            latestDocument: import("../../entities/document.entity").Document | null;
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
    }): Promise<import("../../entities/document.entity").Document>;
    verify(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/document.entity").Document>;
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

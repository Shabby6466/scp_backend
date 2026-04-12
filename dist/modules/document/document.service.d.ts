import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/database.enum';
import { Document, DocumentType } from '../../entities/document.entity';
import { StorageService } from '../storage/storage.service';
import { PresignDto } from './dto/presign.dto';
import { CompleteDocumentDto } from './dto/complete.dto';
import { MailerService } from '../mailer/mailer.service';
import { SearchDocumentDto } from './dto/search-document.dto';
import { UserService } from '../user/user.service';
import { DocumentTypeService } from '../document-type/document-type.service';
import { BranchService } from '../branch/branch.service';
import { StudentParentService } from '../student-parent/student-parent.service';
type CurrentUser = {
    id: string;
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
};
export declare class DocumentService {
    private readonly documentRepository;
    private readonly documentTypeService;
    private readonly userService;
    private readonly branchService;
    private readonly studentParent;
    private readonly storage;
    private readonly mailer;
    private readonly logger;
    constructor(documentRepository: Repository<Document>, documentTypeService: DocumentTypeService, userService: UserService, branchService: BranchService, studentParent: StudentParentService, storage: StorageService, mailer: MailerService);
    findSummaryDocsByOwnerIds(ownerIds: string[]): Promise<Document[]>;
    findRecentDocsByBranch(branchId: string, limit?: number): Promise<Document[]>;
    findComplianceDocsByOwnerIds(ownerIds: string[]): Promise<Document[]>;
    presign(dto: PresignDto, user: CurrentUser): Promise<{
        uploadUrl: string;
        s3Key: string;
        uploadToken?: string;
    }>;
    complete(dto: CompleteDocumentDto, user: CurrentUser): Promise<Document | null>;
    listByOwner(ownerUserId: string, user: CurrentUser): Promise<Document[]>;
    searchDocuments(dto: SearchDocumentDto, user: CurrentUser): Promise<Document[]>;
    getSummaryForOwner(ownerUserId: string, user: CurrentUser): Promise<{
        assignedCount: number;
        uploadedCount: number;
        remainingCount: number;
        items: {
            documentType: DocumentType;
            latestDocument: Document | null;
            remainingDays: number | null;
        }[];
    }>;
    getAssignedSummary(user: CurrentUser): Promise<{
        assignedCount: number;
        uploadedCount: number;
        remainingCount: number;
        items: {
            documentType: DocumentType;
            latestDocument: Document | null;
            remainingDays: number | null;
        }[];
    }>;
    getPerFormDetail(ownerUserId: string, documentTypeId: string, user: CurrentUser): Promise<{
        owner: {
            id: string;
            name: string | null;
            email: string;
        };
        documentType: DocumentType | null;
        latestDocument: Document | null;
        uploadedDate: Date | null;
        dueDate: Date | null;
        remainingDays: number | null;
    }>;
    verify(documentId: string, user: CurrentUser): Promise<Document>;
    verifyMany(documentIds: string[], user: CurrentUser): Promise<{
        count: number;
        total: number;
    }>;
    nudge(ownerUserId: string, documentTypeId: string, user: CurrentUser): Promise<{
        success: boolean;
    }>;
    private syncTeacherClearanceFromVerifiedDocs;
    findDocumentById(documentId: string, user: CurrentUser): Promise<Document>;
    getDownloadUrl(documentId: string, user: CurrentUser): Promise<string>;
    exportPerFormPdf(ownerUserId: string, documentTypeId: string, user: CurrentUser): Promise<{
        buffer: Buffer<ArrayBufferLike>;
        fileName: string;
    }>;
    private resolveOwnerScope;
    private ensureCanAccessDocumentOwner;
    private ensureCanManageBranch;
    countVerifiedInScope(scope: {
        schoolId?: string;
        branchId?: string;
    }, now: Date): Promise<number>;
    countPendingInScope(scope: {
        schoolId?: string;
        branchId?: string;
    }): Promise<number>;
    countInSchool(schoolId: string): Promise<number>;
    countExpiredInScope(scope: {
        schoolId?: string;
        branchId?: string;
    }, now: Date): Promise<number>;
    countNearExpiryInScope(scope: {
        schoolId?: string;
        branchId?: string;
    }, now: Date, nearEnd: Date): Promise<number>;
    findExpiringInScope(scope: {
        schoolId?: string;
        branchId?: string;
    }, now: Date, until: Date, limit: number): Promise<Document[]>;
    findExpiredInScope(scope: {
        schoolId?: string;
        branchId?: string;
    }, now: Date, limit: number): Promise<Document[]>;
    findRecentUnverifiedInScope(scope: {
        schoolId?: string;
        branchId?: string;
    }, limit: number): Promise<Document[]>;
}
export {};

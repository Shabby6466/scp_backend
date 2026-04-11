import { UserRole } from '@prisma/client';
export declare class SearchDocumentDto {
    query?: string;
    schoolId?: string;
    branchId?: string;
    documentTypeId?: string;
    verified?: boolean;
    ownerRole?: UserRole;
    status?: string;
    limit?: number;
    offset?: number;
}

import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { FormsBucket } from './dto/forms-analytics-query.dto.js';
export declare const ANALYTICS_NEAR_EXPIRY_DAYS = 30;
type CurrentUser = {
    id: string;
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
};
type ResolvedScope = {
    kind: 'global';
} | {
    kind: 'school';
    schoolId: string;
} | {
    kind: 'branch';
    branchId: string;
} | {
    kind: 'teacher';
    branchId: string;
};
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    resolveScope(user: CurrentUser): ResolvedScope;
    private scopeWhereSql;
    private typeFilter;
    private dateTruncRaw;
    submissions(user: CurrentUser, from: Date, to: Date, bucket: FormsBucket, documentTypeId?: string): Promise<{
        buckets: {
            label: string;
            count: number;
        }[];
    }>;
    byUploader(user: CurrentUser, from: Date, to: Date, documentTypeId?: string): Promise<{
        byRole: {
            role: import("@prisma/client").$Enums.UserRole;
            count: number;
        }[];
        total: number;
    }>;
    expiryByType(user: CurrentUser, documentTypeId?: string): Promise<{
        rows: {
            formName: string;
            total: number;
            active: number;
            nearExpiry: number;
            expired: number;
            noExpiry: number;
        }[];
    }>;
    getComplianceSummary(user: CurrentUser): Promise<{
        score: number;
        totalRequired: number;
        verifiedCount: number;
        pendingVerification: number;
    }>;
    getPendingActions(user: CurrentUser): Promise<{
        recentUploads: ({
            documentType: {
                name: string;
            };
            ownerUser: {
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
            documentTypeId: string;
            ownerUserId: string;
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
        })[];
        atRiskStaff: {
            name: string | null;
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            _count: {
                ownerDocuments: number;
            };
        }[];
    }>;
}
export {};

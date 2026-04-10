import { UserRole } from '@prisma/client';
import { AnalyticsService } from './analytics.service.js';
import { FormsAnalyticsQueryDto } from './dto/forms-analytics-query.dto.js';
export declare class AnalyticsController {
    private readonly analytics;
    constructor(analytics: AnalyticsService);
    submissions(q: FormsAnalyticsQueryDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        buckets: {
            label: string;
            count: number;
        }[];
    }>;
    byUploader(q: FormsAnalyticsQueryDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        byRole: {
            role: import("@prisma/client").$Enums.UserRole;
            count: number;
        }[];
        total: number;
    }>;
    expiryByType(documentTypeId: string | undefined, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        rows: {
            formName: string;
            total: number;
            active: number;
            nearExpiry: number;
            expired: number;
            noExpiry: number;
        }[];
    }>;
    getComplianceSummary(user: any): Promise<{
        score: number;
        totalRequired: number;
        verifiedCount: number;
        pendingVerification: number;
    }>;
    getPendingActions(user: any): Promise<{
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

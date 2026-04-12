import { DataSource } from 'typeorm';
import { UserRole } from '../common/enums/database.enum';
import type { FormsBucket } from './dto/forms-analytics-query.dto';
import { SchoolService } from '../school/school.service';
import { BranchService } from '../branch/branch.service';
import { UserService } from '../user/user.service';
import { DocumentService } from '../document/document.service';
import { DocumentTypeService } from '../document-type/document-type.service';
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
    private readonly dataSource;
    private readonly schoolService;
    private readonly branchService;
    private readonly userService;
    private readonly documentService;
    private readonly documentTypeService;
    constructor(dataSource: DataSource, schoolService: SchoolService, branchService: BranchService, userService: UserService, documentService: DocumentService, documentTypeService: DocumentTypeService);
    resolveScope(user: CurrentUser): ResolvedScope;
    private scopeWhereSql;
    private typeFilter;
    private dateTruncRaw;
    submissions(user: CurrentUser, from: Date, to: Date, bucket: FormsBucket, documentTypeId?: string): Promise<{
        buckets: any;
    }>;
    byUploader(user: CurrentUser, from: Date, to: Date, documentTypeId?: string): Promise<{
        byRole: any;
        total: any;
    }>;
    expiryByType(user: CurrentUser, documentTypeId?: string): Promise<{
        rows: any;
    }>;
    getComplianceSummary(user: CurrentUser): Promise<{
        score: number;
        totalRequired: number;
        verifiedCount: number;
        pendingVerification: number;
    }>;
    getPendingActions(user: CurrentUser): Promise<{
        recentUploads: import("../../entities/document.entity").Document[];
        atRiskStaff: import("../../entities/user.entity").User[];
    }>;
    private assertSchoolScope;
    getComplianceStats(user: CurrentUser, schoolId?: string, branchId?: string): Promise<{
        studentComplianceRate: number;
        teacherComplianceRate: number;
        student_compliance_rate: number;
        teacher_compliance_rate: number;
        totalExpired: number;
        total_expired: number;
        totalExpiringSoon: number;
        total_expiring_soon: number;
        score: number;
        totalRequired: number;
        verifiedCount: number;
        pendingVerification: number;
    }>;
    listExpiringDocuments(user: CurrentUser, schoolId?: string, branchId?: string, days?: number, limit?: number): Promise<import("../../entities/document.entity").Document[]>;
    listExpiredDocuments(user: CurrentUser, schoolId?: string, branchId?: string, limit?: number): Promise<import("../../entities/document.entity").Document[]>;
    getSchoolDashboardAnalytics(user: CurrentUser, schoolId?: string): Promise<{
        studentCount: number;
        teacherCount: number;
        parentCount: number;
        documentCount: number;
        counts: {
            students: number;
            teachers: number;
            parents: number;
            documents: number;
        };
        expiringStaffCount: number;
        studentsWithoutDocs: number;
    }>;
}
export {};

import { UserRole } from '../common/enums/database.enum';
import { AnalyticsService } from './analytics.service';
import { FormsAnalyticsQueryDto } from './dto/forms-analytics-query.dto';
export declare class AnalyticsController {
    private readonly analytics;
    constructor(analytics: AnalyticsService);
    submissions(q: FormsAnalyticsQueryDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        buckets: any;
    }>;
    byUploader(q: FormsAnalyticsQueryDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        byRole: any;
        total: any;
    }>;
    expiryByType(documentTypeId: string | undefined, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        rows: any;
    }>;
    getComplianceSummary(user: any): Promise<{
        score: number;
        totalRequired: number;
        verifiedCount: number;
        pendingVerification: number;
    }>;
    getPendingActions(user: any): Promise<{
        recentUploads: import("../../entities/document.entity").Document[];
        atRiskStaff: import("../../entities/user.entity").User[];
    }>;
    getComplianceStats(schoolId: string | undefined, branchId: string | undefined, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    listExpiringDocuments(schoolId: string | undefined, branchId: string | undefined, days: number, limit: number, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/document.entity").Document[]>;
    listExpiredDocuments(schoolId: string | undefined, branchId: string | undefined, limit: number, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/document.entity").Document[]>;
    getComplianceRoot(schoolId: string | undefined, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        score: number;
        totalRequired: number;
        verifiedCount: number;
        pendingVerification: number;
    }>;
    getSchoolDashboard(schoolId: string | undefined, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        totalSchools: number;
        pendingSchools: number;
        approvedSchools: number;
        totalUsers: number;
        totalDocuments: number;
        pendingDocuments: number;
        totalStudents: number;
        totalTeachers: number;
    } | {
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

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = exports.ANALYTICS_NEAR_EXPIRY_DAYS = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const database_enum_1 = require("../common/enums/database.enum");
const school_entity_1 = require("../../entities/school.entity");
const user_entity_1 = require("../../entities/user.entity");
const document_entity_1 = require("../../entities/document.entity");
const school_scope_util_1 = require("../auth/school-scope.util");
const school_service_1 = require("../school/school.service");
const branch_service_1 = require("../branch/branch.service");
const user_service_1 = require("../user/user.service");
const document_service_1 = require("../document/document.service");
const document_type_service_1 = require("../document-type/document-type.service");
const branch_dashboard_service_1 = require("../branch/branch-dashboard.service");
exports.ANALYTICS_NEAR_EXPIRY_DAYS = 30;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let AnalyticsService = class AnalyticsService {
    constructor(dataSource, schoolService, branchService, userService, documentService, documentTypeService) {
        this.dataSource = dataSource;
        this.schoolService = schoolService;
        this.branchService = branchService;
        this.userService = userService;
        this.documentService = documentService;
        this.documentTypeService = documentTypeService;
    }
    isUuid(value) {
        return UUID_RE.test(value);
    }
    parseOptionalQueryUuid(raw, paramName) {
        const v = raw?.trim() || undefined;
        if (v && !this.isUuid(v)) {
            throw new common_1.BadRequestException(`Invalid ${paramName}`);
        }
        return v;
    }
    async getPlatformDashboardAnalytics() {
        const schoolRepo = this.dataSource.getRepository(school_entity_1.School);
        const userRepo = this.dataSource.getRepository(user_entity_1.User);
        const docRepo = this.dataSource.getRepository(document_entity_1.Document);
        const [totalSchools, pendingSchools, approvedSchools, totalUsers, totalStudents, totalTeachers, totalDocuments, pendingDocuments,] = await Promise.all([
            schoolRepo.count(),
            schoolRepo.count({ where: { isApproved: false } }),
            schoolRepo.count({ where: { isApproved: true } }),
            userRepo.count(),
            userRepo.count({ where: { role: database_enum_1.UserRole.STUDENT } }),
            userRepo.count({ where: { role: database_enum_1.UserRole.TEACHER } }),
            docRepo.count(),
            docRepo.count({ where: { verifiedAt: (0, typeorm_1.IsNull)() } }),
        ]);
        return {
            totalSchools,
            pendingSchools,
            approvedSchools,
            totalUsers,
            totalDocuments,
            pendingDocuments,
            totalStudents,
            totalTeachers,
        };
    }
    resolveScope(user) {
        if (user.role === database_enum_1.UserRole.ADMIN) {
            return { kind: 'global' };
        }
        if (user.role === database_enum_1.UserRole.TEACHER) {
            if (!user.branchId) {
                throw new common_1.ForbiddenException('Teacher has no branch assignment');
            }
            return { kind: 'teacher', branchId: user.branchId };
        }
        if (user.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
            if (!user.branchId) {
                throw new common_1.ForbiddenException('Branch director has no branch assignment');
            }
            return { kind: 'branch', branchId: user.branchId };
        }
        if (user.role === database_enum_1.UserRole.DIRECTOR || (0, school_scope_util_1.isSchoolDirector)(user)) {
            if (!user.schoolId) {
                throw new common_1.ForbiddenException('Account is not linked to a school');
            }
            return { kind: 'school', schoolId: user.schoolId };
        }
        throw new common_1.ForbiddenException('Insufficient permissions for analytics');
    }
    scopeWhereSql(scope, params) {
        switch (scope.kind) {
            case 'global':
                return 'TRUE';
            case 'school':
                params.push(scope.schoolId);
                return `EXISTS (
          SELECT 1 FROM "User" owner
          INNER JOIN "Branch" b ON b.id = owner."branchId"
          WHERE owner.id = d."ownerUserId" AND b."schoolId" = $${params.length}
        )`;
            case 'teacher':
                params.push(scope.branchId);
                return `EXISTS (
          SELECT 1 FROM "User" owner
          WHERE owner.id = d."ownerUserId" AND owner."branchId" = $${params.length}
        )`;
            case 'branch':
                params.push(scope.branchId);
                return `EXISTS (
          SELECT 1 FROM "User" owner
          WHERE owner.id = d."ownerUserId" AND owner."branchId" = $${params.length}
        )`;
            default:
                return 'FALSE';
        }
    }
    typeFilter(documentTypeId, params) {
        if (!documentTypeId?.trim())
            return 'TRUE';
        params.push(documentTypeId.trim());
        return `d."documentTypeId" = $${params.length}`;
    }
    dateTruncRaw(bucket) {
        const unit = bucket === 'week' ? 'week' : bucket === 'month' ? 'month' : 'day';
        return `date_trunc('${unit}', d."createdAt")`;
    }
    async submissions(user, from, to, bucket, documentTypeId) {
        const scope = this.resolveScope(user);
        const params = [from, to];
        const scopeSql = this.scopeWhereSql(scope, params);
        const typeSql = this.typeFilter(documentTypeId, params);
        const trunc = this.dateTruncRaw(bucket);
        const rows = await this.dataSource.query(`
      SELECT ${trunc} AS bucket,
             COUNT(*)::int AS count
      FROM "Document" d
      WHERE d."createdAt" >= $1
        AND d."createdAt" <= $2
        AND ${scopeSql}
        AND ${typeSql}
      GROUP BY 1
      ORDER BY 1 ASC
    `, params);
        return {
            buckets: rows.map((r) => ({
                label: new Date(r.bucket).toISOString(),
                count: Number(r.count),
            })),
        };
    }
    async byUploader(user, from, to, documentTypeId) {
        const scope = this.resolveScope(user);
        const params = [from, to];
        const scopeSql = this.scopeWhereSql(scope, params);
        const typeSql = this.typeFilter(documentTypeId, params);
        const rows = await this.dataSource.query(`
      SELECT u.role, COUNT(*)::int AS count
      FROM "Document" d
      INNER JOIN "User" u ON u.id = d."uploadedByUserId"
      WHERE d."createdAt" >= $1
        AND d."createdAt" <= $2
        AND ${scopeSql}
        AND ${typeSql}
      GROUP BY u.role
      ORDER BY count DESC
    `, params);
        const byRole = rows.map((r) => ({
            role: r.role,
            count: Number(r.count),
        }));
        const total = byRole.reduce((s, r) => s + r.count, 0);
        return { byRole, total };
    }
    async expiryByType(user, documentTypeId) {
        const scope = this.resolveScope(user);
        const params = [];
        const scopeSql = this.scopeWhereSql(scope, params);
        const typeSql = this.typeFilter(documentTypeId, params);
        const nearDays = exports.ANALYTICS_NEAR_EXPIRY_DAYS;
        const rows = await this.dataSource.query(`
      SELECT
        dt.name AS "formName",
        COUNT(*)::int AS total,
        SUM(CASE WHEN d."expiresAt" IS NULL THEN 1 ELSE 0 END)::int AS "noExpiry",
        SUM(
          CASE
            WHEN d."expiresAt" IS NOT NULL
              AND d."expiresAt"::date < CURRENT_DATE
            THEN 1 ELSE 0
          END
        )::int AS expired,
        SUM(
          CASE
            WHEN d."expiresAt" IS NOT NULL
              AND d."expiresAt"::date >= CURRENT_DATE
              AND d."expiresAt"::date <= CURRENT_DATE + (${nearDays} || ' days')::interval
            THEN 1 ELSE 0
          END
        )::int AS "nearExpiry",
        SUM(
          CASE
            WHEN d."expiresAt" IS NOT NULL
              AND d."expiresAt"::date > CURRENT_DATE + (${nearDays} || ' days')::interval
            THEN 1 ELSE 0
          END
        )::int AS active
      FROM "Document" d
      INNER JOIN "DocumentType" dt ON dt.id = d."documentTypeId"
      WHERE ${scopeSql}
        AND ${typeSql}
      GROUP BY dt.name
      ORDER BY dt.name ASC
    `, params);
        return {
            rows: rows.map((r) => ({
                formName: r.formName,
                total: Number(r.total),
                active: Number(r.active),
                nearExpiry: Number(r.nearExpiry),
                expired: Number(r.expired),
                noExpiry: Number(r.noExpiry),
            })),
        };
    }
    async getComplianceSummary(user) {
        const scope = this.resolveScope(user);
        const loc = scope.kind === 'school' ? { schoolId: scope.schoolId } : (scope.kind === 'branch' || scope.kind === 'teacher' ? { branchId: scope.branchId } : {});
        const roleCounts = await this.userService.countByRoles(loc);
        const docTypes = await this.documentTypeService.findMandatory();
        let totalRequired = 0;
        docTypes.forEach((dt) => {
            totalRequired += roleCounts[dt.targetRole] || 0;
        });
        const verifiedCount = await this.documentService.countVerifiedInScope(loc, new Date());
        const pendingVerification = await this.documentService.countPendingInScope(loc);
        const score = totalRequired > 0
            ? Math.round((verifiedCount / totalRequired) * 100)
            : 100;
        return {
            score,
            totalRequired,
            verifiedCount,
            pendingVerification,
        };
    }
    async getPendingActions(user) {
        const scope = this.resolveScope(user);
        const loc = scope.kind === 'school' ? { schoolId: scope.schoolId } : (scope.kind === 'branch' || scope.kind === 'teacher' ? { branchId: scope.branchId } : {});
        const recentUploads = await this.documentService.findRecentUnverifiedInScope(loc, 5);
        const atRiskStaff = await this.userService.findAtRiskStaff(loc, 5);
        return {
            recentUploads,
            atRiskStaff,
        };
    }
    assertSchoolScope(user, schoolId, branchId) {
        const s = schoolId?.trim() || undefined;
        const b = branchId?.trim() || undefined;
        if (s && !this.isUuid(s)) {
            throw new common_1.BadRequestException('Invalid schoolId');
        }
        if (b && !this.isUuid(b)) {
            throw new common_1.BadRequestException('Invalid branchId');
        }
        if (user.role === database_enum_1.UserRole.ADMIN) {
            if (b)
                return { branchId: b };
            if (s)
                return { schoolId: s };
            throw new common_1.ForbiddenException('schoolId or branchId is required');
        }
        const scope = this.resolveScope(user);
        if (scope.kind === 'school') {
            if (s && s !== scope.schoolId) {
                throw new common_1.ForbiddenException('Cannot access this school');
            }
            return { schoolId: scope.schoolId };
        }
        if (scope.kind === 'branch' || scope.kind === 'teacher') {
            if (b && b !== scope.branchId) {
                throw new common_1.ForbiddenException('Cannot access this branch');
            }
            return { branchId: scope.branchId };
        }
        if (scope.kind === 'global') {
            throw new common_1.ForbiddenException('School scope required');
        }
        throw new common_1.ForbiddenException('Insufficient permissions');
    }
    async getComplianceStats(user, schoolId, branchId) {
        const s = schoolId?.trim() || undefined;
        const b = branchId?.trim() || undefined;
        const loc = this.assertSchoolScope(user, s, b);
        const effectiveUser = user.role === database_enum_1.UserRole.ADMIN && s && !b
            ? {
                ...user,
                role: database_enum_1.UserRole.DIRECTOR,
                schoolId: s,
                branchId: null,
            }
            : user;
        const summary = await this.getComplianceSummary(effectiveUser);
        const now = new Date();
        const nearEnd = new Date(now);
        nearEnd.setDate(nearEnd.getDate() + branch_dashboard_service_1.NEAR_EXPIRY_DAYS);
        const expired = await this.documentService.countExpiredInScope(loc, now);
        const nearExpiry = await this.documentService.countNearExpiryInScope(loc, now, nearEnd);
        const rate = summary.score;
        return {
            studentComplianceRate: rate,
            teacherComplianceRate: rate,
            student_compliance_rate: rate,
            teacher_compliance_rate: rate,
            totalExpired: expired,
            total_expired: expired,
            totalExpiringSoon: nearExpiry,
            total_expiring_soon: nearExpiry,
            score: summary.score,
            totalRequired: summary.totalRequired,
            verifiedCount: summary.verifiedCount,
            pendingVerification: summary.pendingVerification,
        };
    }
    async listExpiringDocuments(user, schoolId, branchId, days = branch_dashboard_service_1.NEAR_EXPIRY_DAYS, limit = 50) {
        const s = schoolId?.trim() || undefined;
        const b = branchId?.trim() || undefined;
        const loc = user.role === database_enum_1.UserRole.ADMIN && !s && !b
            ? {}
            : this.assertSchoolScope(user, s, b);
        const now = new Date();
        const until = new Date(now);
        until.setDate(until.getDate() + Math.min(Math.max(days, 1), 365));
        return this.documentService.findExpiringInScope(loc, now, until, limit);
    }
    async listExpiredDocuments(user, schoolId, branchId, limit = 50) {
        const s = schoolId?.trim() || undefined;
        const b = branchId?.trim() || undefined;
        const loc = user.role === database_enum_1.UserRole.ADMIN && !s && !b
            ? {}
            : this.assertSchoolScope(user, s, b);
        const now = new Date();
        return this.documentService.findExpiredInScope(loc, now, limit);
    }
    async getSchoolDashboardAnalytics(user, schoolId) {
        const q = schoolId?.trim() || undefined;
        if (q && !this.isUuid(q)) {
            throw new common_1.BadRequestException('Invalid schoolId');
        }
        if (user.role === database_enum_1.UserRole.ADMIN && !q) {
            return this.getPlatformDashboardAnalytics();
        }
        const sid = q ?? user.schoolId;
        if (!sid) {
            throw new common_1.ForbiddenException('schoolId is required');
        }
        if (!this.isUuid(sid)) {
            throw new common_1.BadRequestException('Invalid schoolId');
        }
        if (user.role !== database_enum_1.UserRole.ADMIN) {
            if (user.role === database_enum_1.UserRole.DIRECTOR ||
                user.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
                if (user.schoolId !== sid) {
                    throw new common_1.ForbiddenException('Cannot access this school');
                }
            }
            else {
                throw new common_1.ForbiddenException('Insufficient permissions');
            }
        }
        const summary = await this.schoolService.getDashboardSummary(sid, {
            id: user.id,
            role: user.role,
            schoolId: user.schoolId,
            branchId: user.branchId,
        });
        const documentCount = await this.documentService.countInSchool(sid);
        return {
            studentCount: summary.stats.studentCount,
            teacherCount: summary.stats.teacherCount,
            parentCount: summary.stats.parentCount,
            documentCount,
            counts: {
                students: summary.stats.studentCount,
                teachers: summary.stats.teacherCount,
                parents: summary.stats.parentCount,
                documents: documentCount,
            },
            expiringStaffCount: summary.stats.expiringDocs,
            studentsWithoutDocs: summary.stats.pendingDocs,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => school_service_1.SchoolService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => branch_service_1.BranchService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_service_1.UserService))),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => document_service_1.DocumentService))),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => document_type_service_1.DocumentTypeService))),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        school_service_1.SchoolService,
        branch_service_1.BranchService,
        user_service_1.UserService,
        document_service_1.DocumentService,
        document_type_service_1.DocumentTypeService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = exports.ANALYTICS_NEAR_EXPIRY_DAYS = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const school_scope_util_js_1 = require("../auth/school-scope.util.js");
const school_service_js_1 = require("../school/school.service.js");
const branch_dashboard_service_js_1 = require("../branch/branch-dashboard.service.js");
exports.ANALYTICS_NEAR_EXPIRY_DAYS = 30;
let AnalyticsService = class AnalyticsService {
    prisma;
    schoolService;
    constructor(prisma, schoolService) {
        this.prisma = prisma;
        this.schoolService = schoolService;
    }
    resolveScope(user) {
        if (user.role === client_1.UserRole.ADMIN) {
            return { kind: 'global' };
        }
        if (user.role === client_1.UserRole.TEACHER) {
            if (!user.branchId) {
                throw new common_1.ForbiddenException('Teacher has no branch assignment');
            }
            return { kind: 'teacher', branchId: user.branchId };
        }
        if (user.role === client_1.UserRole.BRANCH_DIRECTOR) {
            if (!user.branchId) {
                throw new common_1.ForbiddenException('Branch director has no branch assignment');
            }
            return { kind: 'branch', branchId: user.branchId };
        }
        if (user.role === client_1.UserRole.DIRECTOR || (0, school_scope_util_js_1.isSchoolDirector)(user)) {
            if (!user.schoolId) {
                throw new common_1.ForbiddenException('Account is not linked to a school');
            }
            return { kind: 'school', schoolId: user.schoolId };
        }
        throw new common_1.ForbiddenException('Insufficient permissions for analytics');
    }
    scopeWhereSql(scope) {
        switch (scope.kind) {
            case 'global':
                return client_1.Prisma.sql `TRUE`;
            case 'school':
                return client_1.Prisma.sql `EXISTS (
          SELECT 1 FROM "User" owner
          INNER JOIN "Branch" b ON b.id = owner."branchId"
          WHERE owner.id = d."ownerUserId" AND b."schoolId" = ${scope.schoolId}
        )`;
            case 'teacher':
                return client_1.Prisma.sql `EXISTS (
          SELECT 1 FROM "User" owner
          WHERE owner.id = d."ownerUserId" AND owner."branchId" = ${scope.branchId}
        )`;
            case 'branch':
                return client_1.Prisma.sql `EXISTS (
          SELECT 1 FROM "User" owner
          WHERE owner.id = d."ownerUserId" AND owner."branchId" = ${scope.branchId}
        )`;
            default:
                return client_1.Prisma.sql `FALSE`;
        }
    }
    typeFilter(documentTypeId) {
        if (!documentTypeId?.trim())
            return client_1.Prisma.sql `TRUE`;
        return client_1.Prisma.sql `d."documentTypeId" = ${documentTypeId.trim()}`;
    }
    dateTruncRaw(bucket) {
        const unit = bucket === 'week' ? 'week' : bucket === 'month' ? 'month' : 'day';
        return client_1.Prisma.raw(`date_trunc('${unit}', d."createdAt")`);
    }
    async submissions(user, from, to, bucket, documentTypeId) {
        const scope = this.resolveScope(user);
        const scopeSql = this.scopeWhereSql(scope);
        const typeSql = this.typeFilter(documentTypeId);
        const trunc = this.dateTruncRaw(bucket);
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `
      SELECT ${trunc} AS bucket,
             COUNT(*)::int AS count
      FROM "Document" d
      WHERE d."createdAt" >= ${from}
        AND d."createdAt" <= ${to}
        AND ${scopeSql}
        AND ${typeSql}
      GROUP BY 1
      ORDER BY 1 ASC
    `);
        return {
            buckets: rows.map((r) => ({
                label: r.bucket.toISOString(),
                count: Number(r.count),
            })),
        };
    }
    async byUploader(user, from, to, documentTypeId) {
        const scope = this.resolveScope(user);
        const scopeSql = this.scopeWhereSql(scope);
        const typeSql = this.typeFilter(documentTypeId);
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `
      SELECT u.role, COUNT(*)::int AS count
      FROM "Document" d
      INNER JOIN "User" u ON u.id = d."uploadedById"
      WHERE d."createdAt" >= ${from}
        AND d."createdAt" <= ${to}
        AND ${scopeSql}
        AND ${typeSql}
      GROUP BY u.role
      ORDER BY count DESC
    `);
        const byRole = rows.map((r) => ({
            role: r.role,
            count: Number(r.count),
        }));
        const total = byRole.reduce((s, r) => s + r.count, 0);
        return { byRole, total };
    }
    async expiryByType(user, documentTypeId) {
        const scope = this.resolveScope(user);
        const scopeSql = this.scopeWhereSql(scope);
        const typeSql = this.typeFilter(documentTypeId);
        const nearDays = exports.ANALYTICS_NEAR_EXPIRY_DAYS;
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `
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
              AND d."expiresAt"::date <= CURRENT_DATE + (${nearDays}::text || ' days')::interval
            THEN 1 ELSE 0
          END
        )::int AS "nearExpiry",
        SUM(
          CASE
            WHEN d."expiresAt" IS NOT NULL
              AND d."expiresAt"::date > CURRENT_DATE + (${nearDays}::text || ' days')::interval
            THEN 1 ELSE 0
          END
        )::int AS active
      FROM "Document" d
      INNER JOIN "DocumentType" dt ON dt.id = d."documentTypeId"
      WHERE ${scopeSql}
        AND ${typeSql}
      GROUP BY dt.name
      ORDER BY dt.name ASC
    `);
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
        const scopeSql = this.scopeWhereSql(scope);
        const roleStats = await this.prisma.user.groupBy({
            by: ['role'],
            where: scope.kind === 'global'
                ? {}
                : scope.kind === 'school'
                    ? { branch: { schoolId: scope.schoolId } }
                    : { branchId: scope.branchId },
            _count: true,
        });
        const roleCounts = roleStats.reduce((acc, s) => ({ ...acc, [s.role]: s._count }), {});
        const docTypes = await this.prisma.documentType.findMany({
            where: { isMandatory: true },
            select: { id: true, targetRole: true },
        });
        let totalRequired = 0;
        docTypes.forEach((dt) => {
            totalRequired += roleCounts[dt.targetRole] || 0;
        });
        const verifiedCount = await this.prisma.document.count({
            where: {
                verifiedAt: { not: null },
                expiresAt: { gt: new Date() },
                ownerUser: scope.kind === 'global'
                    ? {}
                    : scope.kind === 'school'
                        ? { branch: { schoolId: scope.schoolId } }
                        : { branchId: scope.branchId },
            },
        });
        const pendingVerification = await this.prisma.document.count({
            where: {
                verifiedAt: null,
                ownerUser: scope.kind === 'global'
                    ? {}
                    : scope.kind === 'school'
                        ? { branch: { schoolId: scope.schoolId } }
                        : { branchId: scope.branchId },
            },
        });
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
        const recentUploads = await this.prisma.document.findMany({
            where: {
                verifiedAt: null,
                ownerUser: scope.kind === 'global'
                    ? {}
                    : scope.kind === 'school'
                        ? { branch: { schoolId: scope.schoolId } }
                        : { branchId: scope.branchId },
            },
            include: {
                ownerUser: { select: { id: true, name: true, email: true } },
                documentType: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
        const atRiskStaff = await this.prisma.user.findMany({
            where: {
                role: { in: [client_1.UserRole.TEACHER, client_1.UserRole.STUDENT] },
                branchId: scope.kind === 'branch' || scope.kind === 'teacher'
                    ? scope.branchId
                    : undefined,
                branch: scope.kind === 'school' ? { schoolId: scope.schoolId } : undefined,
                ownerDocuments: {
                    none: { verifiedAt: { not: null } },
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                _count: {
                    select: { ownerDocuments: true },
                },
            },
            take: 5,
        });
        return {
            recentUploads,
            atRiskStaff,
        };
    }
    assertSchoolScope(user, schoolId, branchId) {
        if (user.role === client_1.UserRole.ADMIN) {
            if (branchId)
                return { branchId };
            if (schoolId)
                return { schoolId };
            throw new common_1.ForbiddenException('schoolId or branchId is required');
        }
        const scope = this.resolveScope(user);
        if (scope.kind === 'school') {
            if (schoolId && schoolId !== scope.schoolId) {
                throw new common_1.ForbiddenException('Cannot access this school');
            }
            return { schoolId: scope.schoolId };
        }
        if (scope.kind === 'branch' || scope.kind === 'teacher') {
            if (branchId && branchId !== scope.branchId) {
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
        const loc = this.assertSchoolScope(user, schoolId, branchId);
        const effectiveUser = user.role === client_1.UserRole.ADMIN && schoolId && !branchId
            ? {
                ...user,
                role: client_1.UserRole.DIRECTOR,
                schoolId,
                branchId: null,
            }
            : user;
        const summary = await this.getComplianceSummary(effectiveUser);
        const ownerWhere = 'schoolId' in loc
            ? { branch: { schoolId: loc.schoolId } }
            : { branchId: loc.branchId };
        const now = new Date();
        const nearEnd = new Date(now);
        nearEnd.setDate(nearEnd.getDate() + branch_dashboard_service_js_1.NEAR_EXPIRY_DAYS);
        const [expired, nearExpiry] = await Promise.all([
            this.prisma.document.count({
                where: {
                    ownerUser: ownerWhere,
                    expiresAt: { lt: now },
                },
            }),
            this.prisma.document.count({
                where: {
                    ownerUser: ownerWhere,
                    expiresAt: { gt: now, lte: nearEnd },
                },
            }),
        ]);
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
    async listExpiringDocuments(user, schoolId, branchId, days = branch_dashboard_service_js_1.NEAR_EXPIRY_DAYS, limit = 50) {
        const loc = this.assertSchoolScope(user, schoolId, branchId);
        const ownerWhere = 'schoolId' in loc
            ? { branch: { schoolId: loc.schoolId } }
            : { branchId: loc.branchId };
        const now = new Date();
        const until = new Date(now);
        until.setDate(until.getDate() + Math.min(Math.max(days, 1), 365));
        const safeLimit = Math.min(Math.max(limit, 1), 200);
        return this.prisma.document.findMany({
            where: {
                ownerUser: ownerWhere,
                expiresAt: { gt: now, lte: until },
            },
            include: {
                documentType: { select: { id: true, name: true, targetRole: true } },
                ownerUser: {
                    select: { id: true, name: true, email: true, role: true },
                },
            },
            orderBy: { expiresAt: 'asc' },
            take: safeLimit,
        });
    }
    async listExpiredDocuments(user, schoolId, branchId, limit = 50) {
        const loc = this.assertSchoolScope(user, schoolId, branchId);
        const ownerWhere = 'schoolId' in loc
            ? { branch: { schoolId: loc.schoolId } }
            : { branchId: loc.branchId };
        const now = new Date();
        const safeLimit = Math.min(Math.max(limit, 1), 200);
        return this.prisma.document.findMany({
            where: {
                ownerUser: ownerWhere,
                expiresAt: { lt: now },
            },
            include: {
                documentType: { select: { id: true, name: true, targetRole: true } },
                ownerUser: {
                    select: { id: true, name: true, email: true, role: true },
                },
            },
            orderBy: { expiresAt: 'desc' },
            take: safeLimit,
        });
    }
    async getSchoolDashboardAnalytics(user, schoolId) {
        const sid = schoolId ?? user.schoolId;
        if (!sid) {
            throw new common_1.ForbiddenException('schoolId is required');
        }
        if (user.role !== client_1.UserRole.ADMIN) {
            if (user.role === client_1.UserRole.DIRECTOR ||
                user.role === client_1.UserRole.BRANCH_DIRECTOR) {
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
        const documentCount = await this.prisma.document.count({
            where: { ownerUser: { branch: { schoolId: sid } } },
        });
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
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        school_service_js_1.SchoolService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map
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
exports.ANALYTICS_NEAR_EXPIRY_DAYS = 30;
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map
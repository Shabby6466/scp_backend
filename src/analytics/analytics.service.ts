import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { isSchoolDirector } from '../auth/school-scope.util.js';
import type { FormsBucket } from './dto/forms-analytics-query.dto.js';
import { SchoolService } from '../school/school.service.js';
import { NEAR_EXPIRY_DAYS } from '../branch/branch-dashboard.service.js';

export const ANALYTICS_NEAR_EXPIRY_DAYS = 30;

type CurrentUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

type ResolvedScope =
  | { kind: 'global' }
  | { kind: 'school'; schoolId: string }
  | { kind: 'branch'; branchId: string }
  | { kind: 'teacher'; branchId: string };

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schoolService: SchoolService,
  ) {}

  resolveScope(user: CurrentUser): ResolvedScope {
    if (user.role === UserRole.ADMIN) {
      return { kind: 'global' };
    }
    if (user.role === UserRole.TEACHER) {
      if (!user.branchId) {
        throw new ForbiddenException('Teacher has no branch assignment');
      }
      return { kind: 'teacher', branchId: user.branchId };
    }
    if (user.role === UserRole.BRANCH_DIRECTOR) {
      if (!user.branchId) {
        throw new ForbiddenException(
          'Branch director has no branch assignment',
        );
      }
      return { kind: 'branch', branchId: user.branchId };
    }
    if (user.role === UserRole.DIRECTOR || isSchoolDirector(user)) {
      if (!user.schoolId) {
        throw new ForbiddenException('Account is not linked to a school');
      }
      return { kind: 'school', schoolId: user.schoolId };
    }
    throw new ForbiddenException('Insufficient permissions for analytics');
  }

  private scopeWhereSql(scope: ResolvedScope): Prisma.Sql {
    switch (scope.kind) {
      case 'global':
        return Prisma.sql`TRUE`;
      case 'school':
        return Prisma.sql`EXISTS (
          SELECT 1 FROM "User" owner
          INNER JOIN "Branch" b ON b.id = owner."branchId"
          WHERE owner.id = d."ownerUserId" AND b."schoolId" = ${scope.schoolId}
        )`;
      case 'teacher':
        return Prisma.sql`EXISTS (
          SELECT 1 FROM "User" owner
          WHERE owner.id = d."ownerUserId" AND owner."branchId" = ${scope.branchId}
        )`;
      case 'branch':
        return Prisma.sql`EXISTS (
          SELECT 1 FROM "User" owner
          WHERE owner.id = d."ownerUserId" AND owner."branchId" = ${scope.branchId}
        )`;
      default:
        return Prisma.sql`FALSE`;
    }
  }

  private typeFilter(documentTypeId?: string): Prisma.Sql {
    if (!documentTypeId?.trim()) return Prisma.sql`TRUE`;
    return Prisma.sql`d."documentTypeId" = ${documentTypeId.trim()}`;
  }

  private dateTruncRaw(bucket: FormsBucket): Prisma.Sql {
    const unit =
      bucket === 'week' ? 'week' : bucket === 'month' ? 'month' : 'day';
    return Prisma.raw(`date_trunc('${unit}', d."createdAt")`);
  }

  async submissions(
    user: CurrentUser,
    from: Date,
    to: Date,
    bucket: FormsBucket,
    documentTypeId?: string,
  ) {
    const scope = this.resolveScope(user);
    const scopeSql = this.scopeWhereSql(scope);
    const typeSql = this.typeFilter(documentTypeId);
    const trunc = this.dateTruncRaw(bucket);

    const rows = await this.prisma.$queryRaw<{ bucket: Date; count: number }[]>(
      Prisma.sql`
      SELECT ${trunc} AS bucket,
             COUNT(*)::int AS count
      FROM "Document" d
      WHERE d."createdAt" >= ${from}
        AND d."createdAt" <= ${to}
        AND ${scopeSql}
        AND ${typeSql}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    );

    return {
      buckets: rows.map((r) => ({
        label: r.bucket.toISOString(),
        count: Number(r.count),
      })),
    };
  }

  async byUploader(
    user: CurrentUser,
    from: Date,
    to: Date,
    documentTypeId?: string,
  ) {
    const scope = this.resolveScope(user);
    const scopeSql = this.scopeWhereSql(scope);
    const typeSql = this.typeFilter(documentTypeId);

    const rows = await this.prisma.$queryRaw<
      { role: UserRole; count: number }[]
    >(
      Prisma.sql`
      SELECT u.role, COUNT(*)::int AS count
      FROM "Document" d
      INNER JOIN "User" u ON u.id = d."uploadedById"
      WHERE d."createdAt" >= ${from}
        AND d."createdAt" <= ${to}
        AND ${scopeSql}
        AND ${typeSql}
      GROUP BY u.role
      ORDER BY count DESC
    `,
    );

    const byRole = rows.map((r) => ({
      role: r.role,
      count: Number(r.count),
    }));
    const total = byRole.reduce((s, r) => s + r.count, 0);
    return { byRole, total };
  }

  async expiryByType(user: CurrentUser, documentTypeId?: string) {
    const scope = this.resolveScope(user);
    const scopeSql = this.scopeWhereSql(scope);
    const typeSql = this.typeFilter(documentTypeId);
    const nearDays = ANALYTICS_NEAR_EXPIRY_DAYS;

    const rows = await this.prisma.$queryRaw<
      {
        formName: string;
        total: number;
        active: number;
        nearExpiry: number;
        expired: number;
        noExpiry: number;
      }[]
    >(Prisma.sql`
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

  async getComplianceSummary(user: CurrentUser) {
    const scope = this.resolveScope(user);
    const scopeSql = this.scopeWhereSql(scope);

    // 1. Get counts of users by role in this scope
    const roleStats = await this.prisma.user.groupBy({
      by: ['role'],
      where:
        scope.kind === 'global'
          ? {}
          : scope.kind === 'school'
            ? { branch: { schoolId: scope.schoolId } }
            : { branchId: scope.branchId },
      _count: true,
    });

    const roleCounts = roleStats.reduce(
      (acc, s) => ({ ...acc, [s.role]: s._count }),
      {} as Record<UserRole, number>,
    );

    // 2. Get mandatory document types and their target roles
    const docTypes = await this.prisma.documentType.findMany({
      where: { isMandatory: true },
      select: { id: true, targetRole: true },
    });

    // 3. Calculate total required documents (sum of roleCount * mandatoryTypesForThatRole)
    let totalRequired = 0;
    docTypes.forEach((dt) => {
      totalRequired += roleCounts[dt.targetRole as UserRole] || 0;
    });

    // 4. Get count of CURRENTLY UPLOADED & VERIFIED documents in this scope
    const verifiedCount = await this.prisma.document.count({
      where: {
        verifiedAt: { not: null },
        expiresAt: { gt: new Date() }, // Only count non-expired
        ownerUser:
          scope.kind === 'global'
            ? {}
            : scope.kind === 'school'
              ? { branch: { schoolId: scope.schoolId } }
              : { branchId: scope.branchId },
      },
    });

    // 5. Get count of documents AWAITING VERIFICATION
    const pendingVerification = await this.prisma.document.count({
      where: {
        verifiedAt: null,
        ownerUser:
          scope.kind === 'global'
            ? {}
            : scope.kind === 'school'
              ? { branch: { schoolId: scope.schoolId } }
              : { branchId: scope.branchId },
      },
    });

    // 6. Calculate Score
    const score =
      totalRequired > 0
        ? Math.round((verifiedCount / totalRequired) * 100)
        : 100;

    return {
      score,
      totalRequired,
      verifiedCount,
      pendingVerification,
    };
  }

  async getPendingActions(user: CurrentUser) {
    const scope = this.resolveScope(user);

    // 1. Get 5 most recent unverified uploads
    const recentUploads = await this.prisma.document.findMany({
      where: {
        verifiedAt: null,
        ownerUser:
          scope.kind === 'global'
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

    // 2. Identify 5 staff members with most missing mandatory docs
    // This is more complex, for now we will get users who have 0 verified docs but have mandatory types
    const atRiskStaff = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.TEACHER, UserRole.STUDENT] },
        branchId:
          scope.kind === 'branch' || scope.kind === 'teacher'
            ? scope.branchId
            : undefined,
        branch:
          scope.kind === 'school' ? { schoolId: scope.schoolId } : undefined,
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

  private assertSchoolScope(
    user: CurrentUser,
    schoolId?: string,
    branchId?: string,
  ): { schoolId: string } | { branchId: string } {
    if (user.role === UserRole.ADMIN) {
      if (branchId) return { branchId };
      if (schoolId) return { schoolId };
      throw new ForbiddenException('schoolId or branchId is required');
    }
    const scope = this.resolveScope(user);
    if (scope.kind === 'school') {
      if (schoolId && schoolId !== scope.schoolId) {
        throw new ForbiddenException('Cannot access this school');
      }
      return { schoolId: scope.schoolId };
    }
    if (scope.kind === 'branch' || scope.kind === 'teacher') {
      if (branchId && branchId !== scope.branchId) {
        throw new ForbiddenException('Cannot access this branch');
      }
      return { branchId: scope.branchId };
    }
    if (scope.kind === 'global') {
      throw new ForbiddenException('School scope required');
    }
    throw new ForbiddenException('Insufficient permissions');
  }

  /**
   * Compatibility shape for `/analytics/compliance/stats` (CRM widgets).
   */
  async getComplianceStats(
    user: CurrentUser,
    schoolId?: string,
    branchId?: string,
  ) {
    const loc = this.assertSchoolScope(user, schoolId, branchId);
    const effectiveUser: CurrentUser =
      user.role === UserRole.ADMIN && schoolId && !branchId
        ? {
            ...user,
            role: UserRole.DIRECTOR,
            schoolId,
            branchId: null,
          }
        : user;
    const summary = await this.getComplianceSummary(effectiveUser);
    const ownerWhere =
      'schoolId' in loc
        ? { branch: { schoolId: loc.schoolId } }
        : { branchId: loc.branchId };

    const now = new Date();
    const nearEnd = new Date(now);
    nearEnd.setDate(nearEnd.getDate() + NEAR_EXPIRY_DAYS);

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

  async listExpiringDocuments(
    user: CurrentUser,
    schoolId?: string,
    branchId?: string,
    days = NEAR_EXPIRY_DAYS,
    limit = 50,
  ) {
    const loc = this.assertSchoolScope(user, schoolId, branchId);
    const ownerWhere =
      'schoolId' in loc
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

  async listExpiredDocuments(
    user: CurrentUser,
    schoolId?: string,
    branchId?: string,
    limit = 50,
  ) {
    const loc = this.assertSchoolScope(user, schoolId, branchId);
    const ownerWhere =
      'schoolId' in loc
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

  async getSchoolDashboardAnalytics(
    user: CurrentUser,
    schoolId?: string,
  ) {
    const sid = schoolId ?? user.schoolId;
    if (!sid) {
      throw new ForbiddenException('schoolId is required');
    }

    if (user.role !== UserRole.ADMIN) {
      if (
        user.role === UserRole.DIRECTOR ||
        user.role === UserRole.BRANCH_DIRECTOR
      ) {
        if (user.schoolId !== sid) {
          throw new ForbiddenException('Cannot access this school');
        }
      } else {
        throw new ForbiddenException('Insufficient permissions');
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
}

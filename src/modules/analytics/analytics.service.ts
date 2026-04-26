import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { UserRole } from '../common/enums/database.enum';
import { School } from '../../entities/school.entity';
import { User } from '../../entities/user.entity';
import { Document } from '../../entities/document.entity';
import { isSchoolDirector } from '../auth/school-scope.util';
import type { FormsBucket } from './dto/forms-analytics-query.dto';
import { SchoolService } from '../school/school.service';
import { BranchService } from '../branch/branch.service';
import { UserService } from '../user/user.service';
import { DocumentService } from '../document/document.service';
import { DocumentTypeService } from '../document-type/document-type.service';
import { NEAR_EXPIRY_DAYS } from '../branch/branch-dashboard.service';
import { StudentProfile } from '../../entities/student-profile.entity';
import { StudentProfileService } from '../student-parent/student-profile.service';
import { ComplianceCategory } from '../../entities/compliance-category.entity';

export const ANALYTICS_NEAR_EXPIRY_DAYS = 30;

/** Reject obvious non-UUIDs (e.g. route placeholders like `school`) before they hit Postgres. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => SchoolService))
    private readonly schoolService: SchoolService,
    @Inject(forwardRef(() => BranchService))
    private readonly branchService: BranchService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => DocumentService))
    private readonly documentService: DocumentService,
    @Inject(forwardRef(() => DocumentTypeService))
    private readonly documentTypeService: DocumentTypeService,
    @Inject(forwardRef(() => StudentProfileService))
    private readonly studentProfileService: StudentProfileService,
  ) { }

  private isUuid(value: string): boolean {
    return UUID_RE.test(value);
  }

  /** Reject non-UUID query values (e.g. path segments mistaken for ids) before compliance queries run. */
  parseOptionalQueryUuid(
    raw: string | undefined,
    paramName: string,
  ): string | undefined {
    const v = raw?.trim() || undefined;
    if (v && !this.isUuid(v)) {
      throw new BadRequestException(`Invalid ${paramName}`);
    }
    return v;
  }

  private async getPlatformDashboardAnalytics() {
    const schoolRepo = this.dataSource.getRepository(School);
    const userRepo = this.dataSource.getRepository(User);
    const docRepo = this.dataSource.getRepository(Document);
    const studentProfileRepo = this.dataSource.getRepository(StudentProfile);

    const [
      totalSchools,
      pendingSchools,
      approvedSchools,
      totalUsers,
      totalStudents,
      totalTeachers,
      totalDocuments,
      pendingDocuments,
    ] = await Promise.all([
      schoolRepo.count(),
      schoolRepo.count({ where: { isApproved: false } }),
      schoolRepo.count({ where: { isApproved: true } }),
      userRepo.count(),
      studentProfileRepo.count(),
      userRepo.count({ where: { role: UserRole.TEACHER } }),
      docRepo.count(),
      docRepo.count({ where: { verifiedAt: IsNull() } }),
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

  private scopeWhereSql(scope: ResolvedScope, params: any[]): string {
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

  private typeFilter(documentTypeId: string | undefined, params: any[]): string {
    if (!documentTypeId?.trim()) return 'TRUE';
    params.push(documentTypeId.trim());
    return `d."documentTypeId" = $${params.length}`;
  }

  private dateTruncRaw(bucket: FormsBucket): string {
    const unit =
      bucket === 'week' ? 'week' : bucket === 'month' ? 'month' : 'day';
    return `date_trunc('${unit}', d."createdAt")`;
  }

  async submissions(
    user: CurrentUser,
    from: Date,
    to: Date,
    bucket: FormsBucket,
    documentTypeId?: string,
  ) {
    const scope = this.resolveScope(user);
    const params: any[] = [from, to];
    const scopeSql = this.scopeWhereSql(scope, params);
    const typeSql = this.typeFilter(documentTypeId, params);
    const trunc = this.dateTruncRaw(bucket);

    const rows = await this.dataSource.query(
      `
      SELECT ${trunc} AS bucket,
             COUNT(*)::int AS count
      FROM "Document" d
      WHERE d."createdAt" >= $1
        AND d."createdAt" <= $2
        AND ${scopeSql}
        AND ${typeSql}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
      params,
    );

    return {
      buckets: rows.map((r: any) => ({
        label: new Date(r.bucket).toISOString(),
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
    const params: any[] = [from, to];
    const scopeSql = this.scopeWhereSql(scope, params);
    const typeSql = this.typeFilter(documentTypeId, params);

    const rows = await this.dataSource.query(
      `
      SELECT u.role, COUNT(*)::int AS count
      FROM "Document" d
      INNER JOIN "User" u ON u.id = d."uploadedByUserId"
      WHERE d."createdAt" >= $1
        AND d."createdAt" <= $2
        AND ${scopeSql}
        AND ${typeSql}
      GROUP BY u.role
      ORDER BY count DESC
    `,
      params,
    );

    const byRole = rows.map((r: any) => ({
      role: r.role,
      count: Number(r.count),
    }));
    const total = byRole.reduce((s: number, r: any) => s + r.count, 0);
    return { byRole, total };
  }

  async expiryByType(user: CurrentUser, documentTypeId?: string) {
    const scope = this.resolveScope(user);
    const params: any[] = [];
    const scopeSql = this.scopeWhereSql(scope, params);
    const typeSql = this.typeFilter(documentTypeId, params);
    const nearDays = ANALYTICS_NEAR_EXPIRY_DAYS;

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
      rows: rows.map((r: any) => ({
        formName: r.formName,
        total: Number(r.total),
        active: Number(r.active),
        nearExpiry: Number(r.nearExpiry),
        expired: Number(r.expired),
        noExpiry: Number(r.noExpiry),
      })),
    };
  }

  private async resolveSchoolIdFromLoc(
    loc: { schoolId?: string; branchId?: string },
  ): Promise<string | null> {
    if (loc.schoolId) return loc.schoolId;
    if (loc.branchId) {
      const br = await this.branchService.findOneById(loc.branchId);
      return br?.schoolId ?? null;
    }
    return null;
  }

  /**
   * School-scoped mandatory document compliance, optional category filter.
   */
  private async computeComplianceRollup(
    loc: { schoolId?: string; branchId?: string },
    categoryId?: string,
  ) {
    const schoolId = await this.resolveSchoolIdFromLoc(loc);
    const now = new Date();
    if (!schoolId) {
      return {
        overallScore: 100,
        totalRequired: 0,
        verifiedCount: 0,
        pendingVerification: 0,
        studentRate: 100,
        teacherRate: 100,
        totalStudents: 0,
        totalTeachers: 0,
        compliantStudents: 0,
        compliantTeachers: 0,
      };
    }

    let types = await this.documentTypeService.findMandatoryInSchool(schoolId, categoryId);
    if (loc.branchId) {
      types = types.filter((t) => !t.branchId || t.branchId === loc.branchId);
    }

    const roleCounts = await this.userService.countByRoles(loc);
    const studentProfileCount = await this.studentProfileService.countInScope(loc);
    const teacherCount = roleCounts[UserRole.TEACHER] || 0;

    const studentTypes = types.filter((t) => t.targetRole === UserRole.STUDENT);
    const teacherTypes = types.filter((t) => t.targetRole === UserRole.TEACHER);

    const totalStudentRequired = studentTypes.length * studentProfileCount;
    const totalTeacherRequired = teacherTypes.length * teacherCount;
    const totalRequired = totalStudentRequired + totalTeacherRequired;

    const studentTypeIds = studentTypes.map((t) => t.id);
    const teacherTypeIds = teacherTypes.map((t) => t.id);
    const allTypeIds = types.map((t) => t.id);

    const verifiedStudentDocs =
      studentTypeIds.length === 0
        ? 0
        : await this.documentService.countVerifiedInScopeForDocumentTypes(
          loc,
          now,
          studentTypeIds,
        );
    const verifiedTeacherDocs =
      teacherTypeIds.length === 0
        ? 0
        : await this.documentService.countVerifiedInScopeForDocumentTypes(
          loc,
          now,
          teacherTypeIds,
        );

    const verifiedCount =
      allTypeIds.length === 0
        ? 0
        : await this.documentService.countVerifiedInScopeForDocumentTypes(loc, now, allTypeIds);

    const pendingVerification =
      allTypeIds.length === 0
        ? 0
        : await this.documentService.countPendingInScopeForDocumentTypes(loc, allTypeIds);

    const studentRate =
      totalStudentRequired > 0
        ? Math.min(100, Math.round((verifiedStudentDocs / totalStudentRequired) * 100))
        : 100;
    const teacherRate =
      totalTeacherRequired > 0
        ? Math.min(100, Math.round((verifiedTeacherDocs / totalTeacherRequired) * 100))
        : 100;
    const overallScore =
      totalRequired > 0
        ? Math.min(100, Math.round((verifiedCount / totalRequired) * 100))
        : 100;

    return {
      overallScore,
      totalRequired,
      verifiedCount,
      pendingVerification,
      studentRate,
      teacherRate,
      totalStudents: studentProfileCount,
      totalTeachers: teacherCount,
      compliantStudents: Math.min(
        studentProfileCount,
        Math.round((studentRate / 100) * studentProfileCount),
      ),
      compliantTeachers: Math.min(
        teacherCount,
        Math.round((teacherRate / 100) * teacherCount),
      ),
    };
  }

  async getComplianceSummary(user: CurrentUser) {
    const scope = this.resolveScope(user);
    if (scope.kind === 'global') {
      return { score: 100, totalRequired: 0, verifiedCount: 0, pendingVerification: 0 };
    }
    const loc =
      scope.kind === 'school'
        ? { schoolId: scope.schoolId }
        : { branchId: scope.branchId };
    const r = await this.computeComplianceRollup(loc, undefined);
    return {
      score: r.overallScore,
      totalRequired: r.totalRequired,
      verifiedCount: r.verifiedCount,
      pendingVerification: r.pendingVerification,
    };
  }

  async getPendingActions(user: CurrentUser) {
    const scope = this.resolveScope(user);
    const loc = scope.kind === 'school' ? { schoolId: scope.schoolId } : (scope.kind === 'branch' || scope.kind === 'teacher' ? { branchId: scope.branchId } : {});

    // 1. Get 5 most recent unverified uploads
    const recentUploads = await this.documentService.findRecentUnverifiedInScope(loc, 5);

    // 2. Identify 5 staff members with most missing mandatory docs (At risk)
    const atRiskStaff = await this.userService.findAtRiskStaff(loc, 5);

    return {
      recentUploads,
      atRiskStaff,
    };
  }

  assertSchoolScope(
    user: CurrentUser,
    schoolId?: string,
    branchId?: string,
  ): { schoolId: string } | { branchId: string } {
    const s = schoolId?.trim() || undefined;
    const b = branchId?.trim() || undefined;
    if (s && !this.isUuid(s)) {
      throw new BadRequestException('Invalid schoolId');
    }
    if (b && !this.isUuid(b)) {
      throw new BadRequestException('Invalid branchId');
    }

    if (user.role === UserRole.ADMIN) {
      if (b) return { branchId: b };
      if (s) return { schoolId: s };
      throw new ForbiddenException('schoolId or branchId is required');
    }
    const scope = this.resolveScope(user);
    if (scope.kind === 'school') {
      if (s && s !== scope.schoolId) {
        throw new ForbiddenException('Cannot access this school');
      }
      return { schoolId: scope.schoolId };
    }
    if (scope.kind === 'branch' || scope.kind === 'teacher') {
      if (b && b !== scope.branchId) {
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
   * Document list scope for reminder sends. Platform admin may omit school/branch for a global sweep
   * (`/reminders/send` only); school routes must supply `schoolId` or `branchId`.
   */
  resolveReminderDocumentScope(
    user: CurrentUser,
    schoolId?: string,
    branchId?: string,
    opts: { allowAdminGlobal?: boolean } = {},
  ): { schoolId?: string; branchId?: string } {
    const s = schoolId?.trim() || undefined;
    const b = branchId?.trim() || undefined;
    if (opts.allowAdminGlobal && user.role === UserRole.ADMIN && !s && !b) {
      return {};
    }
    return this.assertSchoolScope(user, schoolId, branchId);
  }

  /**
   * Compatibility shape for `/analytics/compliance/stats` (CRM widgets).
   */
  async getComplianceStats(
    user: CurrentUser,
    schoolId?: string,
    branchId?: string,
    categorySlug?: string,
  ) {
    const s = schoolId?.trim() || undefined;
    const b = branchId?.trim() || undefined;
    const loc = this.assertSchoolScope(user, s, b);
    const slug = categorySlug?.trim().toLowerCase() || undefined;

    let categoryId: string | undefined;
    const schoolKey = 'schoolId' in loc ? loc.schoolId : undefined;
    if (slug && schoolKey) {
      const catRepo = this.dataSource.getRepository(ComplianceCategory);
      const cat = await catRepo.findOne({
        where: { schoolId: schoolKey, slug },
      });
      categoryId = cat?.id;
    }

    const rollup = await this.computeComplianceRollup(loc, categoryId);

    const now = new Date();
    const nearEnd = new Date(now);
    nearEnd.setDate(nearEnd.getDate() + NEAR_EXPIRY_DAYS);

    const expired = await this.documentService.countExpiredInScope(loc, now);
    const nearExpiry = await this.documentService.countNearExpiryInScope(loc, now, nearEnd);

    return {
      studentComplianceRate: rollup.studentRate,
      teacherComplianceRate: rollup.teacherRate,
      student_compliance_rate: rollup.studentRate,
      teacher_compliance_rate: rollup.teacherRate,
      total_students: rollup.totalStudents,
      total_teachers: rollup.totalTeachers,
      compliant_students: rollup.compliantStudents,
      compliant_teachers: rollup.compliantTeachers,
      totalExpired: expired,
      total_expired: expired,
      totalExpiringSoon: nearExpiry,
      total_expiring_soon: nearExpiry,
      score: rollup.overallScore,
      totalRequired: rollup.totalRequired,
      verifiedCount: rollup.verifiedCount,
      pendingVerification: rollup.pendingVerification,
    };
  }

  async listExpiringDocuments(
    user: CurrentUser,
    schoolId?: string,
    branchId?: string,
    days = NEAR_EXPIRY_DAYS,
    limit = 50,
  ) {
    const s = schoolId?.trim() || undefined;
    const b = branchId?.trim() || undefined;
    const loc =
      user.role === UserRole.ADMIN && !s && !b
        ? ({} as { schoolId?: string; branchId?: string })
        : this.assertSchoolScope(user, s, b);

    const now = new Date();
    const until = new Date(now);
    until.setDate(until.getDate() + Math.min(Math.max(days, 1), 365));

    return this.documentService.findExpiringInScope(loc, now, until, limit);
  }

  async listExpiredDocuments(
    user: CurrentUser,
    schoolId?: string,
    branchId?: string,
    limit = 50,
  ) {
    const s = schoolId?.trim() || undefined;
    const b = branchId?.trim() || undefined;
    const loc =
      user.role === UserRole.ADMIN && !s && !b
        ? ({} as { schoolId?: string; branchId?: string })
        : this.assertSchoolScope(user, s, b);
    const now = new Date();
    return this.documentService.findExpiredInScope(loc, now, limit);
  }

  async getSchoolDashboardAnalytics(
    user: CurrentUser,
    schoolId?: string,
  ) {
    const q = schoolId?.trim() || undefined;
    if (q && !this.isUuid(q)) {
      throw new BadRequestException('Invalid schoolId');
    }

    if (user.role === UserRole.ADMIN && !q) {
      return this.getPlatformDashboardAnalytics();
    }

    const sid = q ?? user.schoolId;
    if (!sid) {
      throw new ForbiddenException('schoolId is required');
    }
    if (!this.isUuid(sid)) {
      throw new BadRequestException('Invalid schoolId');
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
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../../entities/branch.entity';
import { DocumentType } from '../../entities/document.entity';
import { UserRole } from '../common/enums/database.enum';
import {
  canManageBranchLikeDirector,
  directorOwnsBranchSchool,
} from '../auth/school-scope.util';
import { UserService } from '../user/user.service';
import { DocumentService } from '../document/document.service';
import { StudentProfileService } from '../student-parent/student-profile.service';

/** Documents expiring within this many days (and still valid) count as "near expiry". */
export const NEAR_EXPIRY_DAYS = 30;

type CurrentUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

@Injectable()
export class BranchDashboardService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => DocumentService))
    private readonly documentService: DocumentService,
    @Inject(forwardRef(() => StudentProfileService))
    private readonly studentProfileService: StudentProfileService,
  ) { }

  private docSatisfiedKey(d: {
    ownerUserId: string;
    studentProfileId?: string | null;
    documentTypeId: string;
  }) {
    const subjectId = d.studentProfileId ?? d.ownerUserId;
    return `${subjectId}:${d.documentTypeId}`;
  }

  async ensureBranchDashboardAccess(branchId: string, user: CurrentUser) {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (user.role === UserRole.ADMIN) {
      return branch;
    }

    if (user.role === UserRole.DIRECTOR) {
      if (user.schoolId !== branch.schoolId) {
        throw new ForbiddenException('Cannot access this branch');
      }
      return branch;
    }

    if (directorOwnsBranchSchool(user, branch.schoolId)) {
      return branch;
    }

    if (canManageBranchLikeDirector(user, branch)) {
      return branch;
    }

    throw new ForbiddenException('Cannot access branch dashboard');
  }

  async getDashboardSummary(branchId: string, user: CurrentUser) {
    const branch = await this.ensureBranchDashboardAccess(branchId, user);
    const now = new Date();

    const [studentProfiles, teachers] = await Promise.all([
      this.studentProfileService.findByBranchForCompliance(branchId),
      this.userService.findTeachersWithRequiredDocs(branchId),
    ]);

    const ownerIds = [
      ...studentProfiles.map((s) => s.id),
      ...teachers.map((u) => u.id),
    ];

    const branchDocs =
      ownerIds.length === 0
        ? []
        : await this.documentService.findSummaryDocsByOwnerIds(ownerIds);

    let formsNearExpiryCount = 0;
    const satisfiedKeys = new Set<string>();

    for (const d of branchDocs) {
      if (this.isNearExpiry(d.expiresAt, now)) {
        formsNearExpiryCount += 1;
      }
      if (!this.isDocCurrentlyValid(d.expiresAt, now)) continue;
      satisfiedKeys.add(this.docSatisfiedKey(d));
    }

    let requiredSlots = 0;
    let satisfiedSlots = 0;

    const countPerson = (u: { id: string; requiredDocTypes: DocumentType[] }) => {
      if (!u.requiredDocTypes) return;
      for (const t of u.requiredDocTypes) {
        requiredSlots += 1;
        if (satisfiedKeys.has(`${u.id}:${t.id}`)) satisfiedSlots += 1;
      }
    };

    for (const s of studentProfiles) countPerson(s as any);
    for (const t of teachers) countPerson(t as any);

    const missingSlots = requiredSlots - satisfiedSlots;

    const teachersWithPosition = teachers.filter(
      (t) => t.staffPosition != null && t.branchId === branchId,
    );
    const teachersConsidered = teachersWithPosition.length;

    let teachersWithAllRequiredForms = 0;
    for (const teacher of teachersWithPosition) {
      const reqs = teacher.requiredDocTypes || [];
      if (reqs.length === 0) {
        teachersWithAllRequiredForms += 1;
        continue;
      }
      const allOk = reqs.every((t) =>
        satisfiedKeys.has(`${teacher.id}:${t.id}`),
      );
      if (allOk) teachersWithAllRequiredForms += 1;
    }

    return {
      branchId,
      schoolId: branch.schoolId,
      studentCount: studentProfiles.length,
      teacherCount: teachers.length,
      teachersConsidered,
      teachersWithAllRequiredForms,
      formsNearExpiryCount,
      compliance: {
        requiredSlots,
        satisfiedSlots,
        missingSlots,
      },
    };
  }

  async getRecentDocuments(branchId: string, user: CurrentUser, limit = 20) {
    await this.ensureBranchDashboardAccess(branchId, user);

    const merged = await this.documentService.findRecentDocsByBranch(branchId, limit);

    return merged.map((d) => ({
      id: d.id,
      formRef: d.id.slice(0, 8),
      fileName: d.fileName,
      documentTypeName: d.documentType.name,
      category: d.documentType.targetRole,
      issuedAt: d.issuedAt?.toISOString() ?? null,
      expiresAt: d.expiresAt?.toISOString() ?? null,
      createdAt: d.createdAt.toISOString(),
      addedBy: {
        id: d.uploadedBy?.id,
        name: d.uploadedBy?.name,
        email: d.uploadedBy?.email,
      },
    }));
  }

  async getCompliancePeople(branchId: string, user: CurrentUser) {
    await this.ensureBranchDashboardAccess(branchId, user);
    const now = new Date();

    const [studentProfiles, teachers] = await Promise.all([
      this.studentProfileService.findByBranchForCompliance(branchId),
      this.userService.findTeachersWithRequiredDocs(branchId),
    ]);

    const ownerIds = [
      ...studentProfiles.map((s) => s.id),
      ...teachers.map((u) => u.id),
    ];

    const docs =
      ownerIds.length === 0
        ? []
        : await this.documentService.findComplianceDocsByOwnerIds(ownerIds);

    const validPair = new Set<string>();
    for (const d of docs) {
      if (!this.isDocCurrentlyValid(d.expiresAt, now)) continue;
      validPair.add(this.docSatisfiedKey(d));
    }

    const students = studentProfiles.map((s) => {
      const requiredIds = (s.requiredDocTypes || []).map((t) => t.id);
      const requiredCount = requiredIds.length;
      let uploadedSatisfiedCount = 0;
      for (const id of requiredIds) {
        if (validPair.has(`${s.id}:${id}`)) uploadedSatisfiedCount += 1;
      }
      return {
        kind: 'STUDENT' as const,
        studentProfileId: s.id,
        name: s.name ?? s.email,
        guardianName: s.studentProfile?.guardianName ?? null,
        guardianEmail: null as string | null,
        requiredCount,
        uploadedSatisfiedCount,
        missingCount: requiredCount - uploadedSatisfiedCount,
      };
    });

    const teacherRows = teachers.map((teacher) => {
      const requiredIds = (teacher.requiredDocTypes || []).map((t) => t.id);
      const requiredCount = requiredIds.length;
      let uploadedSatisfiedCount = 0;
      for (const id of requiredIds) {
        if (validPair.has(`${teacher.id}:${id}`)) uploadedSatisfiedCount += 1;
      }
      return {
        kind: 'TEACHER' as const,
        userId: teacher.id,
        name: teacher.name ?? teacher.email,
        email: teacher.email,
        requiredCount,
        uploadedSatisfiedCount,
        missingCount: requiredCount - uploadedSatisfiedCount,
      };
    });

    return { students, teachers: teacherRows };
  }

  private isDocCurrentlyValid(expiresAt: Date | null, now: Date): boolean {
    if (expiresAt == null) return true;
    return expiresAt > now;
  }

  private isNearExpiry(expiresAt: Date | null, now: Date): boolean {
    if (expiresAt == null) return false;
    if (expiresAt <= now) return false;
    const end = new Date(now);
    end.setDate(end.getDate() + NEAR_EXPIRY_DAYS);
    return expiresAt <= end;
  }
}

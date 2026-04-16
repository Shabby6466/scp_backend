import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, IsNull, Repository } from 'typeorm';
import { StudentProfile } from '../../entities/student-profile.entity';
import { DocumentType } from '../../entities/document.entity';
import { UserRole } from '../common/enums/database.enum';

/** Row shape compatible with branch dashboard / compliance (formerly student User). */
export type StudentProfileComplianceRow = {
  id: string;
  name: string | null;
  email: string | null;
  requiredDocTypes: DocumentType[];
  studentProfile: StudentProfile;
};

@Injectable()
export class StudentProfileService {
  constructor(
    @InjectRepository(StudentProfile)
    private readonly studentProfileRepository: Repository<StudentProfile>,
    @InjectRepository(DocumentType)
    private readonly documentTypeRepository: Repository<DocumentType>,
  ) { }

  async findOneInternal(id: string) {
    return this.studentProfileRepository.findOne({
      where: { id },
      relations: ['school', 'branch'],
    });
  }

  /**
   * School-wide student types only (`branchId` null). Prefer
   * `findRequiredDocTypesForStudentProfile` when a branch is known.
   */
  async findRequiredDocTypesForSchool(schoolId: string | null) {
    return this.findRequiredDocTypesForStudentProfile(schoolId, null);
  }

  /**
   * Merges school-wide STUDENT document types with branch-specific ones for that branch.
   */
  async findRequiredDocTypesForStudentProfile(
    schoolId: string | null,
    branchId: string | null,
  ): Promise<DocumentType[]> {
    if (!schoolId) return [];

    const schoolWide = await this.documentTypeRepository.find({
      where: {
        schoolId,
        targetRole: UserRole.STUDENT,
        branchId: IsNull(),
      },
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: ['category'],
    });

    if (!branchId) {
      return schoolWide;
    }

    const branchSpecific = await this.documentTypeRepository.find({
      where: { schoolId, targetRole: UserRole.STUDENT, branchId },
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: ['category'],
    });

    return this.mergeStudentRequirementTypes(schoolWide, branchSpecific);
  }

  /** Same merge/sort as `findRequiredDocTypesForStudentProfile` (for batch counting). */
  private mergeStudentRequirementTypes(
    schoolWide: DocumentType[],
    branchSpecific: DocumentType[],
  ): DocumentType[] {
    const byId = new Map<string, DocumentType>();
    for (const dt of schoolWide) {
      byId.set(dt.id, dt);
    }
    for (const dt of branchSpecific) {
      byId.set(dt.id, dt);
    }
    return Array.from(byId.values()).sort((a, b) => {
      const o = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (o !== 0) return o;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
  }

  /**
   * Branch-accurate merged STUDENT requirement counts for many profiles in one DB round-trip
   * per school (document types loaded with `schoolId IN (...)`).
   */
  async countRequiredDocTypesByProfileRows(
    profiles: { id: string; schoolId: string | null; branchId: string | null }[],
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (profiles.length === 0) return result;

    const schoolIds = [
      ...new Set(profiles.map((p) => p.schoolId).filter((x): x is string => !!x)),
    ];

    for (const p of profiles) {
      if (!p.schoolId) {
        result.set(p.id, 0);
      }
    }

    if (schoolIds.length === 0) {
      return result;
    }

    const allTypes = await this.documentTypeRepository.find({
      where: { schoolId: In(schoolIds), targetRole: UserRole.STUDENT },
    });

    const bySchool = new Map<string, DocumentType[]>();
    for (const t of allTypes) {
      const sid = t.schoolId;
      if (!sid) continue;
      if (!bySchool.has(sid)) bySchool.set(sid, []);
      bySchool.get(sid)!.push(t);
    }

    for (const p of profiles) {
      const sid = p.schoolId;
      if (!sid) continue;

      const types = bySchool.get(sid) ?? [];
      const schoolWide = types.filter((t) => t.branchId == null);
      const branchSpecific =
        p.branchId != null
          ? types.filter((t) => t.branchId === p.branchId)
          : [];

      const merged =
        p.branchId != null
          ? this.mergeStudentRequirementTypes(schoolWide, branchSpecific)
          : schoolWide;

      result.set(p.id, merged.length);
    }

    return result;
  }

  async findByBranchForCompliance(
    branchId: string,
  ): Promise<StudentProfileComplianceRow[]> {
    const profiles = await this.studentProfileRepository.find({
      where: { branchId },
      relations: ['branch'],
      order: { createdAt: 'ASC' },
    });

    const rows: StudentProfileComplianceRow[] = await Promise.all(
      profiles.map(async (p) => {
        const schoolId =
          p.schoolId ?? p.branch?.schoolId ?? null;
        const requiredDocTypes =
          await this.findRequiredDocTypesForStudentProfile(
            schoolId,
            p.branchId ?? null,
          );
        return {
          id: p.id,
          name:
            [p.firstName, p.lastName].filter(Boolean).join(' ').trim() || null,
          email: null,
          requiredDocTypes,
          studentProfile: p,
        };
      }),
    );
    return rows;
  }

  async findBySchoolId(schoolId: string): Promise<StudentProfile[]> {
    return this.studentProfileRepository.find({
      where: { schoolId },
      relations: ['branch'],
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  async countInScope(scope: { schoolId?: string; branchId?: string }) {
    const qb = this.studentProfileRepository.createQueryBuilder('sp');
    if (scope.branchId) {
      qb.where('sp.branchId = :branchId', { branchId: scope.branchId });
    } else if (scope.schoolId) {
      qb.leftJoin('sp.branch', 'b').andWhere(
        new Brackets((w) => {
          w.where('sp.schoolId = :schoolId', { schoolId: scope.schoolId }).orWhere(
            'b.schoolId = :schoolId',
            { schoolId: scope.schoolId },
          );
        }),
      );
    }
    return qb.getCount();
  }
}

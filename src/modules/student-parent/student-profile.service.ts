import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
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

  async findRequiredDocTypesForSchool(schoolId: string | null) {
    if (!schoolId) return [];
    return this.documentTypeRepository.find({
      where: { schoolId, targetRole: UserRole.STUDENT },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findByBranchForCompliance(
    branchId: string,
  ): Promise<StudentProfileComplianceRow[]> {
    const profiles = await this.studentProfileRepository.find({
      where: { branchId },
      relations: ['branch'],
      order: { createdAt: 'ASC' },
    });
    const schoolId =
      profiles[0]?.schoolId ?? profiles[0]?.branch?.schoolId ?? null;
    const requiredDocTypes = await this.findRequiredDocTypesForSchool(schoolId);

    return profiles.map((p) => ({
      id: p.id,
      name:
        [p.firstName, p.lastName].filter(Boolean).join(' ').trim() || null,
      email: null,
      requiredDocTypes,
      studentProfile: p,
    }));
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

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../common/enums/database.enum';
import { StudentParent } from '../../entities/student-parent.entity';
import { User } from '../../entities/user.entity';
import { StudentProfile } from '../../entities/student-profile.entity';
import { Branch } from '../../entities/branch.entity';
import { isSchoolDirector } from '../auth/school-scope.util';
import { UserService } from '../user/user.service';
import type { RegisterChildDto } from './dto/register-child.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';

type JwtUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

@Injectable()
export class StudentParentService {
  constructor(
    @InjectRepository(StudentParent)
    private readonly studentParentRepository: Repository<StudentParent>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @InjectRepository(StudentProfile)
    private readonly studentProfileRepository: Repository<StudentProfile>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly dataSource: DataSource,
  ) { }

  private normalizeOptionalUuidInput(
    raw: string | null | undefined,
  ): string | null | undefined {
    if (raw === undefined) return undefined;
    if (raw === null) return null;
    const t = String(raw).trim();
    if (!t) return null;
    const lower = t.toLowerCase();
    if (
      lower === '_none_' ||
      lower === 'none' ||
      lower === '_null_' ||
      lower === 'null' ||
      lower === 'undefined'
    ) {
      return null;
    }
    return t;
  }

  private async assertBranchInSchool(branchId: string, schoolId: string) {
    const b = await this.branchRepository.findOne({ where: { id: branchId } });
    if (!b || b.schoolId !== schoolId) {
      throw new BadRequestException(
        'Branch must belong to the selected school',
      );
    }
  }

  private async assertParentRecord(parentId: string) {
    const parent = await this.userService.findOneInternal(parentId);
    if (!parent) {
      throw new NotFoundException('User not found');
    }
    return parent;
  }

  private async loadStudentProfile(studentProfileId: string) {
    const profile = await this.studentProfileRepository.findOne({
      where: { id: studentProfileId },
      relations: ['branch', 'school'],
    });
    if (!profile) {
      throw new NotFoundException('Student not found');
    }
    return profile;
  }

  /** Parent may access documents for this child profile when linked. */
  async isLinked(parentId: string, studentProfileId: string): Promise<boolean> {
    const count = await this.studentParentRepository.count({
      where: { parentId, studentProfileId },
    });
    return count > 0;
  }

  async findLinksForStudentProfile(studentProfileId: string) {
    return this.studentParentRepository.find({
      where: { studentProfileId },
      relations: ['parent'],
    });
  }

  private async assertCanAccessParentView(parentId: string, user: JwtUser) {
    const parent = await this.assertParentRecord(parentId);

    if (user.role === UserRole.ADMIN) {
      return;
    }
    if (user.id === parentId) {
      return;
    }
    if (isSchoolDirector(user) && user.schoolId === parent.schoolId) {
      return;
    }
    if (
      user.role === UserRole.BRANCH_DIRECTOR &&
      user.schoolId === parent.schoolId
    ) {
      return;
    }
    if (user.role === UserRole.TEACHER && user.branchId) {
      const anyInBranch = await this.studentParentRepository.count({
        where: {
          parentId,
          studentProfile: { branchId: user.branchId },
        },
      });
      if (anyInBranch > 0) {
        return;
      }
    }

    throw new ForbiddenException('Cannot access these records');
  }

  private profileSchoolId(profile: StudentProfile) {
    return profile.schoolId ?? profile.branch?.schoolId ?? null;
  }

  private async assertCanAccessStudentProfileView(
    studentProfileId: string,
    user: JwtUser,
  ) {
    const profile = await this.loadStudentProfile(studentProfileId);
    const profileSchoolId = this.profileSchoolId(profile);

    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (isSchoolDirector(user) && user.schoolId === profileSchoolId) {
      return;
    }
    if (
      user.role === UserRole.BRANCH_DIRECTOR &&
      user.branchId &&
      profile.branchId === user.branchId
    ) {
      return;
    }
    if (
      user.role === UserRole.TEACHER &&
      user.branchId &&
      profile.branchId === user.branchId
    ) {
      return;
    }
    if (user.role === UserRole.PARENT) {
      const link = await this.studentParentRepository.findOne({
        where: { studentProfileId, parentId: user.id },
      });
      if (link) {
        return;
      }
    }

    throw new ForbiddenException('Cannot access these records');
  }

  async listForParent(parentId: string, user: JwtUser) {
    await this.assertCanAccessParentView(parentId, user);

    const rows = await this.studentParentRepository.find({
      where: { parentId },
      relations: ['studentProfile', 'studentProfile.branch', 'studentProfile.school'],
      order: { createdAt: 'ASC' },
    });

    return rows.map((r) => {
      const p = r.studentProfile;
      return {
        id: r.id,
        studentId: r.studentProfileId,
        parentId: r.parentId,
        relation: r.relation,
        isPrimary: r.isPrimary,
        createdAt: r.createdAt.toISOString(),
        student: {
          id: p.id,
          name:
            [p.firstName, p.lastName].filter(Boolean).join(' ').trim() ||
            null,
          email: null as string | null,
          role: null as string | null,
          branchId: p.branchId,
          schoolId: p.schoolId,
          branch: p.branch
            ? { id: p.branch.id, name: p.branch.name }
            : null,
          school: p.school
            ? { id: p.school.id, name: p.school.name }
            : null,
          studentProfile: {
            firstName: p.firstName,
            lastName: p.lastName,
            dateOfBirth: p.dateOfBirth
              ? p.dateOfBirth.toISOString()
              : null,
            gradeLevel: p.gradeLevel,
          },
        },
      };
    });
  }

  async listForStudentProfile(studentProfileId: string, user: JwtUser) {
    await this.assertCanAccessStudentProfileView(studentProfileId, user);

    const rows = await this.studentParentRepository.find({
      where: { studentProfileId },
      relations: ['parent'],
      order: { createdAt: 'ASC' },
    });

    return rows.map((r) => ({
      id: r.id,
      studentId: r.studentProfileId,
      parentId: r.parentId,
      relation: r.relation,
      isPrimary: r.isPrimary,
      createdAt: r.createdAt.toISOString(),
      parent: {
        id: r.parent.id,
        name: r.parent.name,
        email: r.parent.email,
        phone: r.parent.phone,
        role: r.parent.role,
        schoolId: r.parent.schoolId,
      },
    }));
  }

  async create(
    dto: {
      studentProfileId: string;
      parentId: string;
      relation?: string;
      isPrimary?: boolean;
    },
    user: JwtUser,
  ) {
    await this.assertCanAccessStudentProfileView(dto.studentProfileId, user);
    await this.assertCanAccessParentView(dto.parentId, user);

    const parentUser = await this.assertParentRecord(dto.parentId);
    if (parentUser.role !== UserRole.PARENT) {
      throw new BadRequestException('parentId must refer to a user with role PARENT');
    }

    const created = this.studentParentRepository.create({
      studentProfileId: dto.studentProfileId,
      parentId: dto.parentId,
      relation: dto.relation?.trim() || undefined,
      isPrimary: dto.isPrimary ?? false,
    });

    await this.studentParentRepository.save(created);

    return this.studentParentRepository.findOne({
      where: { id: created.id },
      relations: ['studentProfile', 'parent'],
    });
  }

  async registerChild(dto: RegisterChildDto, user: JwtUser) {
    if (user.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only a parent can register a child');
    }
    const parent = await this.assertParentRecord(user.id);
    if (parent.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only a parent can register a child');
    }

    const first = dto.firstName.trim();
    const last = dto.lastName.trim();
    const name = `${first} ${last}`.trim();
    const dob = new Date(`${dto.dateOfBirth}T12:00:00.000Z`);
    if (Number.isNaN(dob.getTime())) {
      throw new BadRequestException('Invalid dateOfBirth');
    }

    return this.dataSource.transaction(async (manager) => {
      const profile = manager.create(StudentProfile, {
        firstName: first,
        lastName: last,
        dateOfBirth: dob,
        gradeLevel: dto.gradeLevel?.trim() || null,
        schoolId: parent.schoolId,
        branchId: parent.branchId,
      });
      await manager.save(profile);

      const link = manager.create(StudentParent, {
        studentProfileId: profile.id,
        parentId: user.id,
        relation: 'parent',
        isPrimary: true,
      });
      await manager.save(link);

      return {
        student: {
          id: profile.id,
          name,
          email: null,
          role: null,
          schoolId: profile.schoolId,
          branchId: profile.branchId,
          studentProfile: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            dateOfBirth: profile.dateOfBirth?.toISOString() ?? null,
            gradeLevel: profile.gradeLevel,
          },
        },
        link: {
          id: link.id,
          studentId: link.studentProfileId,
          parentId: link.parentId,
        },
      };
    });
  }

  async getStudentProfileById(profileId: string, user: JwtUser) {
    await this.assertCanAccessStudentProfileView(profileId, user);
    return this.loadStudentProfile(profileId);
  }

  async updateStudentProfile(
    profileId: string,
    dto: UpdateStudentProfileDto,
    user: JwtUser,
  ) {
    await this.assertCanAccessStudentProfileView(profileId, user);
    const profile = await this.loadStudentProfile(profileId);

    const first = dto.firstName ?? dto.first_name;
    const last = dto.lastName ?? dto.last_name;
    const dobRaw = dto.dateOfBirth ?? dto.date_of_birth;
    const grade = dto.gradeLevel ?? dto.grade_level;
    const schoolIn =
      dto.schoolId !== undefined || dto.school_id !== undefined
        ? this.normalizeOptionalUuidInput(dto.schoolId ?? dto.school_id)
        : undefined;
    const branchIn =
      dto.branchId !== undefined || dto.branch_id !== undefined
        ? this.normalizeOptionalUuidInput(dto.branchId ?? dto.branch_id)
        : undefined;

    if (
      first === undefined &&
      last === undefined &&
      dobRaw === undefined &&
      grade === undefined &&
      schoolIn === undefined &&
      branchIn === undefined
    ) {
      throw new BadRequestException('No fields to update');
    }

    if (first !== undefined) {
      const t = first?.trim();
      if (!t) {
        throw new BadRequestException('firstName cannot be empty');
      }
      profile.firstName = t;
    }
    if (last !== undefined) {
      const t = last?.trim();
      if (!t) {
        throw new BadRequestException('lastName cannot be empty');
      }
      profile.lastName = t;
    }
    if (dobRaw !== undefined) {
      if (dobRaw === null || dobRaw === '') {
        profile.dateOfBirth = null;
      } else {
        const s = String(dobRaw).trim();
        const d = new Date(`${s}T12:00:00.000Z`);
        if (Number.isNaN(d.getTime())) {
          throw new BadRequestException('Invalid dateOfBirth');
        }
        profile.dateOfBirth = d;
      }
    }
    if (grade !== undefined) {
      profile.gradeLevel =
        grade === null || String(grade).trim() === ''
          ? null
          : String(grade).trim();
    }

    if (schoolIn !== undefined || branchIn !== undefined) {
      if (user.role !== UserRole.ADMIN && !isSchoolDirector(user)) {
        throw new ForbiddenException(
          'Only administrators or school directors can change school or branch',
        );
      }
      if (user.role !== UserRole.ADMIN && isSchoolDirector(user)) {
        if (
          schoolIn !== undefined &&
          schoolIn !== null &&
          schoolIn !== user.schoolId
        ) {
          throw new ForbiddenException(
            'Cannot assign a student to a different school',
          );
        }
      }

      if (schoolIn !== undefined) {
        profile.schoolId = schoolIn ?? null;
      }

      if (profile.branchId && profile.schoolId) {
        const existingBranch = await this.branchRepository.findOne({
          where: { id: profile.branchId },
        });
        if (
          !existingBranch ||
          existingBranch.schoolId !== profile.schoolId
        ) {
          profile.branchId = null;
        }
      }
      if (!profile.schoolId) {
        profile.branchId = null;
      }

      if (branchIn !== undefined) {
        if (branchIn) {
          if (!profile.schoolId) {
            throw new BadRequestException(
              'Assign a school before assigning a branch',
            );
          }
          await this.assertBranchInSchool(branchIn, profile.schoolId);
          profile.branchId = branchIn;
        } else {
          profile.branchId = null;
        }
      }
    }

    await this.studentProfileRepository.save(profile);
    return this.loadStudentProfile(profileId);
  }

  async remove(linkId: string, user: JwtUser) {
    const link = await this.studentParentRepository.findOne({
      where: { id: linkId },
    });
    if (!link) {
      throw new NotFoundException('Link not found');
    }

    await this.assertCanAccessStudentProfileView(link.studentProfileId, user);
    await this.assertCanAccessParentView(link.parentId, user);

    await this.studentParentRepository.delete(linkId);
    return { ok: true };
  }
}

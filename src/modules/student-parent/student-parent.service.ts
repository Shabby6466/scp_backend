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
import { isSchoolDirector } from '../auth/school-scope.util';
import { UserService } from '../user/user.service';
import type { RegisterChildDto } from './dto/register-child.dto';

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
    private readonly dataSource: DataSource,
  ) { }

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

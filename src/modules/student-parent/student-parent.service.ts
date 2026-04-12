import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/database.enum';
import { StudentParent } from '../../entities/student-parent.entity';
import { isSchoolDirector } from '../auth/school-scope.util';
import { UserService } from '../user/user.service';

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
  ) { }

  private async assertParentRecord(parentId: string) {
    const parent = await this.userService.findOneInternal(parentId);
    if (!parent) {
      throw new NotFoundException('User not found');
    }
    return parent;
  }

  /** User id on the "student" side of a link (must exist). Role check is not required for reads. */
  private async loadStudentSideUser(studentId: string) {
    const student = await this.userService.findOneInternal(studentId);
    if (!student) {
      throw new NotFoundException('User not found');
    }
    return student;
  }

  async isLinked(parentId: string, studentId: string): Promise<boolean> {
    const count = await this.studentParentRepository.count({
      where: { parentId, studentId },
    });
    return count > 0;
  }

  /** Whether `user` may read links involving this parent user id. */
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
    if (user.role === UserRole.BRANCH_DIRECTOR && user.schoolId === parent.schoolId) {
      return;
    }
    if (user.role === UserRole.TEACHER && user.branchId) {
      const anyInBranch = await this.studentParentRepository.count({
        where: {
          parentId,
          student: { branchId: user.branchId },
        },
      });
      if (anyInBranch > 0) {
        return;
      }
    }

    throw new ForbiddenException('Cannot access these records');
  }

  private async assertCanAccessStudentView(studentId: string, user: JwtUser) {
    const student = await this.loadStudentSideUser(studentId);

    if (user.role === UserRole.ADMIN) {
      return;
    }
    if (user.id === studentId) {
      return;
    }

    if (isSchoolDirector(user) && user.schoolId === student.schoolId) {
      return;
    }
    if (
      user.role === UserRole.BRANCH_DIRECTOR &&
      user.branchId &&
      student.branchId === user.branchId
    ) {
      return;
    }
    if (
      user.role === UserRole.TEACHER &&
      user.branchId &&
      student.branchId === user.branchId
    ) {
      return;
    }
    if (user.role === UserRole.PARENT) {
      const link = await this.studentParentRepository.findOne({
        where: { studentId, parentId: user.id },
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
      relations: ['student', 'student.branch', 'student.school'],
      order: { createdAt: 'ASC' },
    });

    return rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      parentId: r.parentId,
      relation: r.relation,
      isPrimary: r.isPrimary,
      createdAt: r.createdAt.toISOString(),
      student: {
        id: r.student.id,
        name: r.student.name,
        email: r.student.email,
        role: r.student.role,
        branchId: r.student.branchId,
        schoolId: r.student.schoolId,
        branch: r.student.branch ? { id: r.student.branch.id, name: r.student.branch.name } : null,
        school: r.student.school ? { id: r.student.school.id, name: r.student.school.name } : null,
      },
    }));
  }

  async listForStudent(studentId: string, user: JwtUser) {
    await this.assertCanAccessStudentView(studentId, user);

    const rows = await this.studentParentRepository.find({
      where: { studentId },
      relations: ['parent'],
      order: { createdAt: 'ASC' },
    });

    return rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
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
      studentId: string;
      parentId: string;
      relation?: string;
      isPrimary?: boolean;
    },
    user: JwtUser,
  ) {
    await this.assertCanAccessStudentView(dto.studentId, user);
    await this.assertCanAccessParentView(dto.parentId, user);

    const studentUser = await this.loadStudentSideUser(dto.studentId);
    if (studentUser.role !== UserRole.STUDENT) {
      throw new BadRequestException(
        'studentId must refer to a user with role STUDENT',
      );
    }

    const created = this.studentParentRepository.create({
      studentId: dto.studentId,
      parentId: dto.parentId,
      relation: dto.relation?.trim() || undefined,
      isPrimary: dto.isPrimary ?? false,
    });

    await this.studentParentRepository.save(created);

    return this.studentParentRepository.findOne({
      where: { id: created.id },
      relations: ['student', 'parent'],
    });
  }

  async remove(linkId: string, user: JwtUser) {
    const link = await this.studentParentRepository.findOne({
      where: { id: linkId },
    });
    if (!link) {
      throw new NotFoundException('Link not found');
    }

    await this.assertCanAccessStudentView(link.studentId, user);
    await this.assertCanAccessParentView(link.parentId, user);

    await this.studentParentRepository.delete(linkId);
    return { ok: true };
  }
}

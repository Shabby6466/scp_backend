import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { isSchoolDirector } from '../auth/school-scope.util.js';

type JwtUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

@Injectable()
export class StudentParentService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertParentRecord(parentId: string) {
    const parent = await this.prisma.user.findUnique({
      where: { id: parentId },
      select: { id: true, role: true, schoolId: true, branchId: true },
    });
    if (!parent) {
      throw new NotFoundException('User not found');
    }
    return parent;
  }

  /** User id on the "student" side of a link (must exist). Role check is not required for reads. */
  private async loadStudentSideUser(studentId: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        role: true,
        schoolId: true,
        branchId: true,
      },
    });
    if (!student) {
      throw new NotFoundException('User not found');
    }
    return student;
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
      const anyInBranch = await this.prisma.studentParent.count({
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
      const link = await this.prisma.studentParent.findFirst({
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

    const rows = await this.prisma.studentParent.findMany({
      where: { parentId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            branchId: true,
            schoolId: true,
            branch: { select: { id: true, name: true } },
            school: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      parentId: r.parentId,
      relation: r.relation,
      isPrimary: r.isPrimary,
      createdAt: r.createdAt.toISOString(),
      student: r.student,
    }));
  }

  async listForStudent(studentId: string, user: JwtUser) {
    await this.assertCanAccessStudentView(studentId, user);

    const rows = await this.prisma.studentParent.findMany({
      where: { studentId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            schoolId: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      parentId: r.parentId,
      relation: r.relation,
      isPrimary: r.isPrimary,
      createdAt: r.createdAt.toISOString(),
      parent: r.parent,
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

    const created = await this.prisma.studentParent.create({
      data: {
        studentId: dto.studentId,
        parentId: dto.parentId,
        relation: dto.relation?.trim() || undefined,
        isPrimary: dto.isPrimary ?? false,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, name: true, email: true } },
      },
    });

    return created;
  }

  async remove(linkId: string, user: JwtUser) {
    const link = await this.prisma.studentParent.findUnique({
      where: { id: linkId },
    });
    if (!link) {
      throw new NotFoundException('Link not found');
    }

    await this.assertCanAccessStudentView(link.studentId, user);
    await this.assertCanAccessParentView(link.parentId, user);

    await this.prisma.studentParent.delete({ where: { id: linkId } });
    return { ok: true };
  }
}

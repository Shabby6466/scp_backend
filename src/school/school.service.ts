import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSchoolDto } from './dto/create-school.dto.js';
import { UpdateSchoolDto } from './dto/update-school.dto.js';
import { isSchoolDirector } from '../auth/school-scope.util.js';
import { BranchDashboardService } from '../branch/branch-dashboard.service.js';

type DashboardUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

@Injectable()
export class SchoolService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchDashboardService: BranchDashboardService,
  ) {}

  async create(dto: CreateSchoolDto) {
    return this.prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: { name: dto.name.trim() },
      });

      const directorId = dto.directorUserId?.trim();
      if (directorId) {
        const director = await tx.user.findUnique({
          where: { id: directorId },
        });

        if (!director) {
          throw new NotFoundException('Director user not found');
        }

        if (director.role === UserRole.ADMIN) {
          throw new BadRequestException(
            'A platform admin cannot be assigned as a school director',
          );
        }

        if (director.role !== UserRole.DIRECTOR) {
          throw new BadRequestException(
            'Selected user must have the director role',
          );
        }

        await tx.user.update({
          where: { id: director.id },
          data: {
            schoolId: school.id,
            branchId: null,
            staffPosition: null,
            staffClearanceActive: false,
          },
        });
      }

      return tx.school.findUniqueOrThrow({
        where: { id: school.id },
        include: {
          _count: { select: { users: true, branches: true } },
        },
      });
    });
  }

  async findAll(user: { role: UserRole; schoolId: string | null }) {
    if (user.role === UserRole.DIRECTOR && !user.schoolId) {
      return [];
    }
    if (user.role === UserRole.BRANCH_DIRECTOR && user.schoolId) {
      return this.prisma.school.findMany({
        where: { id: user.schoolId },
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { users: true, branches: true } },
        },
      });
    }
    const where = isSchoolDirector(user) ? { id: user.schoolId! } : {};
    return this.prisma.school.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true, branches: true } },
      },
    });
  }

  async findOne(id: string, user: { role: UserRole; schoolId: string | null }) {
    if (user.role === UserRole.DIRECTOR) {
      if (!user.schoolId || user.schoolId !== id) {
        throw new ForbiddenException('Cannot access this school');
      }
    }
    if (user.role === UserRole.BRANCH_DIRECTOR) {
      if (!user.schoolId || user.schoolId !== id) {
        throw new ForbiddenException('Cannot access this school');
      }
    }
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
        _count: { select: { users: true, branches: true } },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    return school;
  }

  async update(
    id: string,
    dto: UpdateSchoolDto,
    user?: { role: UserRole; schoolId: string | null },
  ) {
    if (user?.role === UserRole.DIRECTOR) {
      if (!user.schoolId || user.schoolId !== id) {
        throw new ForbiddenException('Cannot update this school');
      }
    }
    await this.findOne(id, user ?? { role: UserRole.ADMIN, schoolId: null });
    return this.prisma.school.update({
      where: { id },
      data: dto.name != null ? { name: dto.name.trim() } : {},
    });
  }

  async remove(id: string) {
    await this.findOne(id, { role: UserRole.ADMIN, schoolId: null });
    return this.prisma.school.delete({
      where: { id },
    });
  }

  /**
   * School-wide stats for the dashboard shell (sidebar/topbar), aggregated across branches.
   */
  async getDashboardSummary(id: string, user: DashboardUser) {
    await this.findOne(id, user);

    const school = await this.prisma.school.findUnique({
      where: { id },
      select: { name: true },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const branches = await this.prisma.branch.findMany({
      where: { schoolId: id },
      select: { id: true },
    });

    const branchUser: DashboardUser = {
      id: user.id,
      role: user.role,
      schoolId: user.schoolId,
      branchId: user.branchId,
    };

    let studentCount = 0;
    let teacherCount = 0;
    let pendingDocs = 0;
    let expiringDocs = 0;

    for (const b of branches) {
      const summary = await this.branchDashboardService.getDashboardSummary(
        b.id,
        branchUser,
      );
      studentCount += summary.studentCount;
      teacherCount += summary.teacherCount;
      pendingDocs += summary.compliance.missingSlots;
      expiringDocs += summary.formsNearExpiryCount;
    }

    const parentCount = await this.prisma.user.count({
      where: {
        schoolId: id,
        role: UserRole.PARENT,
        deletedAt: null,
      },
    });

    return {
      name: school.name,
      stats: {
        pendingDocs,
        expiringDocs,
        studentCount,
        teacherCount,
        parentCount,
      },
    };
  }

  async listComplianceRequirements(
    id: string,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    await this.findOne(id, user);
    return this.prisma.complianceRequirement.findMany({
      where: { schoolId: id },
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        inspectionType: {
          select: { id: true, name: true, frequency: true },
        },
        owner: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async listInspectionTypes(
    id: string,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    await this.findOne(id, user);
    return this.prisma.inspectionType.findMany({
      where: { schoolId: id },
      orderBy: { name: 'asc' },
    });
  }

  async listCertificationRecords(
    id: string,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    await this.findOne(id, user);
    return this.prisma.certificationRecord.findMany({
      where: { schoolId: id },
      orderBy: { updatedAt: 'desc' },
      include: {
        certificationType: {
          select: { id: true, name: true, defaultValidityMonths: true },
        },
      },
    });
  }
}

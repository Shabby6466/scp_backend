import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateComplianceCategoryDto } from './dto/create-compliance-category.dto.js';
import { UpdateComplianceCategoryDto } from './dto/update-compliance-category.dto.js';

type CurrentUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

const categoryInclude = {
  school: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  _count: { select: { documentTypes: true } },
} as const;

@Injectable()
export class ComplianceCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateComplianceCategoryDto, user: CurrentUser) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.DIRECTOR) {
      throw new ForbiddenException(
        'Only admins and directors can create compliance categories',
      );
    }

    let schoolId: string;

    if (user.role === UserRole.ADMIN) {
      if (!dto.schoolId) {
        throw new BadRequestException(
          'schoolId is required when creating as admin',
        );
      }
      const school = await this.prisma.school.findUnique({
        where: { id: dto.schoolId },
      });
      if (!school) throw new NotFoundException('School not found');
      schoolId = dto.schoolId;
    } else {
      if (!user.schoolId) {
        throw new ForbiddenException('Your account is not linked to a school');
      }
      schoolId = user.schoolId;
    }

    const slug = dto.slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');

    const existing = await this.prisma.complianceCategory.findUnique({
      where: { schoolId_slug: { schoolId, slug } },
    });
    if (existing) {
      throw new BadRequestException(
        `A category with slug "${slug}" already exists for this school`,
      );
    }

    return this.prisma.complianceCategory.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        icon: dto.icon || null,
        sortOrder: dto.sortOrder ?? 0,
        schoolId,
        createdById: user.id,
      },
      include: categoryInclude,
    });
  }

  async update(id: string, dto: UpdateComplianceCategoryDto, user: CurrentUser) {
    const category = await this.prisma.complianceCategory.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException('Compliance category not found');

    this.assertAccess(user, category.schoolId);

    const data: Prisma.ComplianceCategoryUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined)
      data.description = dto.description?.trim() || null;
    if (dto.icon !== undefined) data.icon = dto.icon || null;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;

    if (Object.keys(data).length === 0) {
      return this.prisma.complianceCategory.findUniqueOrThrow({
        where: { id },
        include: categoryInclude,
      });
    }

    return this.prisma.complianceCategory.update({
      where: { id },
      data,
      include: categoryInclude,
    });
  }

  async delete(id: string, user: CurrentUser) {
    const category = await this.prisma.complianceCategory.findUnique({
      where: { id },
      include: { _count: { select: { documentTypes: true } } },
    });
    if (!category) throw new NotFoundException('Compliance category not found');

    this.assertAccess(user, category.schoolId);

    if (category._count.documentTypes > 0) {
      throw new BadRequestException(
        'Cannot delete a category that has document types linked to it. Unlink the document types first.',
      );
    }

    await this.prisma.complianceCategory.delete({ where: { id } });
    return { deleted: true };
  }

  async findAll(user: CurrentUser, schoolId?: string) {
    const where: Prisma.ComplianceCategoryWhereInput = {};

    if (user.role === UserRole.ADMIN) {
      if (schoolId) where.schoolId = schoolId;
    } else {
      if (!user.schoolId) {
        throw new ForbiddenException('Your account is not linked to a school');
      }
      where.schoolId = user.schoolId;
    }

    return this.prisma.complianceCategory.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: categoryInclude,
    });
  }

  async findOne(id: string, user: CurrentUser) {
    const category = await this.prisma.complianceCategory.findUnique({
      where: { id },
      include: categoryInclude,
    });
    if (!category) throw new NotFoundException('Compliance category not found');

    this.assertAccess(user, category.schoolId);
    return category;
  }

  async findBySlug(slug: string, user: CurrentUser) {
    if (!user.schoolId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Your account is not linked to a school');
    }

    const schoolId = user.schoolId;
    if (!schoolId) {
      throw new BadRequestException(
        'schoolId is required for slug-based lookup',
      );
    }

    const category = await this.prisma.complianceCategory.findUnique({
      where: { schoolId_slug: { schoolId, slug } },
      include: categoryInclude,
    });
    if (!category) throw new NotFoundException('Compliance category not found');

    return category;
  }

  async getScore(id: string, user: CurrentUser) {
    const category = await this.prisma.complianceCategory.findUnique({
      where: { id },
      include: {
        documentTypes: {
          include: {
            requiredUsers: {
              select: { id: true, role: true },
            },
            documents: {
              select: {
                id: true,
                ownerUserId: true,
                expiresAt: true,
                verifiedAt: true,
              },
            },
          },
        },
      },
    });

    if (!category) throw new NotFoundException('Compliance category not found');
    this.assertAccess(user, category.schoolId);

    const now = new Date();
    const sixtyDaysFromNow = new Date(
      now.getTime() + 60 * 24 * 60 * 60 * 1000,
    );

    let totalSlots = 0;
    let satisfiedSlots = 0;
    let expiringSoon = 0;
    let expired = 0;
    const byRole: Record<string, { total: number; satisfied: number }> = {};

    for (const docType of category.documentTypes) {
      for (const requiredUser of docType.requiredUsers) {
        totalSlots++;

        const role = requiredUser.role;
        if (!byRole[role]) byRole[role] = { total: 0, satisfied: 0 };
        byRole[role].total++;

        const userDocs = docType.documents.filter(
          (d) => d.ownerUserId === requiredUser.id,
        );

        const validDoc = userDocs.find(
          (d) => d.expiresAt === null || d.expiresAt > now,
        );

        if (validDoc) {
          satisfiedSlots++;
          byRole[role].satisfied++;

          if (
            validDoc.expiresAt &&
            validDoc.expiresAt > now &&
            validDoc.expiresAt <= sixtyDaysFromNow
          ) {
            expiringSoon++;
          }
        }

        const hasExpiredDoc =
          userDocs.some((d) => d.expiresAt && d.expiresAt <= now) && !validDoc;
        if (hasExpiredDoc) expired++;
      }
    }

    const score = totalSlots > 0 ? (satisfiedSlots / totalSlots) * 100 : 0;

    return {
      categoryId: id,
      categoryName: category.name,
      categorySlug: category.slug,
      totalSlots,
      satisfiedSlots,
      score: Math.round(score * 10) / 10,
      expiringSoon,
      expired,
      byRole,
    };
  }

  private assertAccess(user: CurrentUser, schoolId: string) {
    if (user.role === UserRole.ADMIN) return;
    if (!user.schoolId) {
      throw new ForbiddenException('Your account is not linked to a school');
    }
    if (user.schoolId !== schoolId) {
      throw new ForbiddenException('Category is outside your school');
    }
  }
}

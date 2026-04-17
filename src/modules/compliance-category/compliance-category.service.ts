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
import { ComplianceCategory } from '../../entities/compliance-category.entity';
import { UserRole } from '../common/enums/database.enum';
import { CreateComplianceCategoryDto } from './dto/create-compliance-category.dto';
import { UpdateComplianceCategoryDto } from './dto/update-compliance-category.dto';
import { SchoolService } from '../school/school.service';
import { UserService } from '../user/user.service';
import { DEFAULT_COMPLIANCE_CATEGORY_PRESETS } from './compliance-category.presets';

type CurrentUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

@Injectable()
export class ComplianceCategoryService {
  constructor(
    @InjectRepository(ComplianceCategory)
    private readonly categoryRepository: Repository<ComplianceCategory>,
    @Inject(forwardRef(() => SchoolService))
    private readonly schoolService: SchoolService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) { }

  /**
   * Idempotently creates the four default compliance categories for a school.
   */
  async ensureDefaultCategoriesForSchool(
    schoolId: string,
    createdByUserId: string,
  ): Promise<void> {
    const school = await this.schoolService.findOneInternal(schoolId);
    if (!school) return;

    for (const preset of DEFAULT_COMPLIANCE_CATEGORY_PRESETS) {
      const existing = await this.categoryRepository.findOne({
        where: { schoolId, slug: preset.slug },
      });
      if (existing) continue;

      await this.categoryRepository.save(
        this.categoryRepository.create({
          name: preset.name,
          slug: preset.slug,
          description: preset.description,
          icon: preset.icon,
          sortOrder: preset.sortOrder,
          schoolId,
          createdById: createdByUserId,
        }),
      );
    }
  }

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
      const school = await this.schoolService.findOneInternal(dto.schoolId);
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

    const existing = await this.categoryRepository.findOne({
      where: { schoolId, slug },
    });
    if (existing) {
      throw new BadRequestException(
        `A category with slug "${slug}" already exists for this school`,
      );
    }

    const category = this.categoryRepository.create({
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim() || null,
      icon: dto.icon || null,
      sortOrder: dto.sortOrder ?? 0,
      schoolId,
      createdById: user.id,
    });

    return this.categoryRepository.save(category);
  }

  async update(id: string, dto: UpdateComplianceCategoryDto, user: CurrentUser) {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });
    if (!category) throw new NotFoundException('Compliance category not found');

    this.assertAccess(user, category.schoolId);

    if (dto.name !== undefined) category.name = dto.name.trim();
    if (dto.description !== undefined)
      category.description = dto.description?.trim() || null;
    if (dto.icon !== undefined) category.icon = dto.icon || null;
    if (dto.sortOrder !== undefined) category.sortOrder = dto.sortOrder;

    return this.categoryRepository.save(category);
  }

  async delete(id: string, user: CurrentUser) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: [
        'documentTypes',
        'certificationTypes',
        'inspectionTypes',
      ],
    });
    if (!category) throw new NotFoundException('Compliance category not found');

    this.assertAccess(user, category.schoolId);

    if (category.documentTypes && category.documentTypes.length > 0) {
      throw new BadRequestException(
        'Cannot delete a category that has document types linked to it. Unlink the document types first.',
      );
    }
    if (category.certificationTypes && category.certificationTypes.length > 0) {
      throw new BadRequestException(
        'Cannot delete a category that has certification types linked to it. Unlink or reassign them first.',
      );
    }
    if (category.inspectionTypes && category.inspectionTypes.length > 0) {
      throw new BadRequestException(
        'Cannot delete a category that has inspection types linked to it. Unlink or reassign them first.',
      );
    }

    await this.categoryRepository.remove(category);
    return { deleted: true };
  }

  async findAll(user: CurrentUser, schoolId?: string) {
    const where: any = {};

    if (user.role === UserRole.ADMIN) {
      if (schoolId) where.schoolId = schoolId;
    } else {
      if (!user.schoolId) {
        throw new ForbiddenException('Your account is not linked to a school');
      }
      where.schoolId = user.schoolId;
    }

    let rows = await this.categoryRepository.find({
      where,
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: ['school', 'createdBy'],
    });

    const effectiveSchoolId =
      user.role === UserRole.ADMIN
        ? schoolId?.trim() || undefined
        : user.schoolId ?? undefined;

    /** Presets are idempotent; merge when the school has zero rows OR any default slug is missing (e.g. only a custom "Health and safety" existed). */
    const missingAnyPreset =
      !!effectiveSchoolId &&
      !DEFAULT_COMPLIANCE_CATEGORY_PRESETS.every((p) =>
        rows.some(
          (r) => r.schoolId === effectiveSchoolId && r.slug === p.slug,
        ),
      );

    const canEnsurePresets =
      user.role === UserRole.DIRECTOR ||
      user.role === UserRole.BRANCH_DIRECTOR ||
      (user.role === UserRole.ADMIN && !!schoolId?.trim());

    if (missingAnyPreset && canEnsurePresets) {
      await this.ensureDefaultCategoriesForSchool(effectiveSchoolId!, user.id);
      rows = await this.categoryRepository.find({
        where,
        order: { sortOrder: 'ASC', name: 'ASC' },
        relations: ['school', 'createdBy'],
      });
    }

    return rows;
  }

  async findOne(id: string, user: CurrentUser) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['school', 'createdBy'],
    });
    if (!category) throw new NotFoundException('Compliance category not found');

    this.assertAccess(user, category.schoolId);
    return category;
  }

  async findOneInternal(id: string) {
    return this.categoryRepository.findOne({ where: { id } });
  }

  /** Internal resolver for linking CertificationType / InspectionType to a preset category (no auth). */
  async findOneBySchoolAndSlugInternal(
    schoolId: string,
    slug: string,
  ): Promise<ComplianceCategory | null> {
    const normalized = slug
      .trim()
      .toLowerCase()
      .replace(/_/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    if (!normalized) return null;
    return this.categoryRepository.findOne({
      where: { schoolId, slug: normalized },
    });
  }

  async assertCategoryBelongsToSchool(
    categoryId: string,
    schoolId: string,
  ): Promise<ComplianceCategory> {
    const row = await this.categoryRepository.findOne({
      where: { id: categoryId, schoolId },
    });
    if (!row) {
      throw new BadRequestException(
        'complianceCategoryId does not exist for this school',
      );
    }
    return row;
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

    const category = await this.categoryRepository.findOne({
      where: { schoolId, slug },
      relations: ['school', 'createdBy'],
    });
    if (!category) throw new NotFoundException('Compliance category not found');

    return category;
  }

  async getScore(id: string, user: CurrentUser) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: [
        'documentTypes',
        'documentTypes.requiredUsers',
        'documentTypes.documents',
      ],
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

    for (const docType of category.documentTypes || []) {
      for (const requiredUser of docType.requiredUsers || []) {
        totalSlots++;

        const role = requiredUser.role;
        if (!byRole[role]) byRole[role] = { total: 0, satisfied: 0 };
        byRole[role].total++;

        const userDocs = (docType.documents || []).filter(
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

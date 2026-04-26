import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  forwardRef,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CertificationType } from '../../entities/certification-type.entity';
import { Branch } from '../../entities/branch.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/database.enum';
import { ComplianceCategoryService } from '../compliance-category/compliance-category.service';
import { SchoolService } from '../school/school.service';

type Actor = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

@Controller('certification-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificationTypesController {
  constructor(
    @InjectRepository(CertificationType)
    private readonly repo: Repository<CertificationType>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly complianceCategoryService: ComplianceCategoryService,
    @Inject(forwardRef(() => SchoolService))
    private readonly schoolService: SchoolService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  async list(
    @Query('schoolId') schoolId: string | undefined,
    @Query('branchId') branchId: string | undefined,
    @CurrentUser() actor: Actor,
  ) {
    if (!schoolId) return [];
    if (actor.role !== UserRole.ADMIN) {
      await this.schoolService.findOne(schoolId, actor);
    }

    const qb = this.repo
      .createQueryBuilder('ct')
      .where('ct.schoolId = :schoolId', { schoolId })
      .orderBy('ct.name', 'ASC')
      .leftJoinAndSelect('ct.complianceCategory', 'complianceCategory');

    if (actor.role === UserRole.BRANCH_DIRECTOR && actor.branchId) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('ct.branchId IS NULL').orWhere('ct.branchId = :bid', {
            bid: actor.branchId,
          });
        }),
      );
    }

    if (branchId?.trim()) {
      qb.andWhere('ct.branchId = :qbid', { qbid: branchId.trim() });
    }

    return qb.getMany();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  async get(@Param('id') id: string, @CurrentUser() actor: Actor) {
    const row = await this.repo.findOne({
      where: { id },
      relations: ['complianceCategory'],
    });
    if (!row) return null;
    if (actor.role !== UserRole.ADMIN) {
      await this.schoolService.findOne(row.schoolId, actor);
      if (
        actor.role === UserRole.BRANCH_DIRECTOR &&
        actor.branchId &&
        row.branchId &&
        row.branchId !== actor.branchId
      ) {
        throw new ForbiddenException('Cannot access this certification type');
      }
    }
    return row;
  }

  private async resolveComplianceCategoryId(
    schoolId: string,
    body: Record<string, unknown>,
    actorUserId: string,
  ): Promise<string | null> {
    const rawId = body.complianceCategoryId ?? body.compliance_category_id;
    if (typeof rawId === 'string' && rawId.trim()) {
      const cat = await this.complianceCategoryService.assertCategoryBelongsToSchool(
        rawId.trim(),
        schoolId,
      );
      return cat.id;
    }
    const rawSlug =
      (typeof body.complianceCategorySlug === 'string' && body.complianceCategorySlug) ||
      (typeof body.compliance_category_slug === 'string' && body.compliance_category_slug) ||
      'certifications';
    let found = await this.complianceCategoryService.findOneBySchoolAndSlugInternal(
      schoolId,
      String(rawSlug),
    );
    if (!found) {
      await this.complianceCategoryService.ensureDefaultCategoriesForSchool(
        schoolId,
        actorUserId,
      );
      found = await this.complianceCategoryService.findOneBySchoolAndSlugInternal(
        schoolId,
        String(rawSlug),
      );
    }
    return found?.id ?? null;
  }

  private async assertBranchForSchool(
    branchId: string | null | undefined,
    schoolId: string,
  ) {
    if (branchId == null || branchId === '') return;
    const b = await this.branchRepository.findOne({ where: { id: branchId } });
    if (!b || b.schoolId !== schoolId) {
      throw new BadRequestException('Branch must belong to the school');
    }
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR)
  async create(
    @Body()
    body: {
      schoolId: string;
      name: string;
      description?: string | null;
      defaultValidityMonths?: number | null;
      complianceCategoryId?: string | null;
      complianceCategorySlug?: string | null;
      branchId?: string | null;
      branch_id?: string | null;
    },
    @CurrentUser() actor: Actor,
  ) {
    await this.schoolService.findOne(body.schoolId, actor);

    const branchId = body.branchId ?? body.branch_id ?? null;
    await this.assertBranchForSchool(
      branchId != null && String(branchId).trim() !== ''
        ? String(branchId).trim()
        : null,
      body.schoolId,
    );

    const complianceCategoryId = await this.resolveComplianceCategoryId(
      body.schoolId,
      body as Record<string, unknown>,
      actor.id,
    );
    const row = this.repo.create({
      schoolId: body.schoolId,
      branchId:
        branchId != null && String(branchId).trim() !== ''
          ? String(branchId).trim()
          : null,
      name: body.name?.trim(),
      description: body.description ?? null,
      defaultValidityMonths: body.defaultValidityMonths ?? 12,
      complianceCategoryId,
    } as any);
    return this.repo.save(row);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR)
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() actor: Actor,
  ) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) return null;
    await this.schoolService.findOne(row.schoolId, actor);

    if (body.name !== undefined) row.name = String(body.name).trim();
    if (body.description !== undefined) row.description = body.description ?? null;
    if (body.defaultValidityMonths !== undefined) row.defaultValidityMonths = body.defaultValidityMonths ?? null;

    if (body.branchId !== undefined || body.branch_id !== undefined) {
      const raw = body.branchId ?? body.branch_id ?? null;
      row.branchId =
        raw != null && String(raw).trim() !== '' ? String(raw).trim() : null;
      await this.assertBranchForSchool(row.branchId, row.schoolId);
    }

    if (
      body.complianceCategoryId !== undefined ||
      body.compliance_category_id !== undefined ||
      body.complianceCategorySlug !== undefined ||
      body.compliance_category_slug !== undefined
    ) {
      row.complianceCategoryId = await this.resolveComplianceCategoryId(
        row.schoolId,
        body as Record<string, unknown>,
        actor.id,
      );
    }
    return this.repo.save(row);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.repo.delete(id);
    return { success: true };
  }
}

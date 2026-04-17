import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CertificationType } from '../../entities/certification-type.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/database.enum';
import { ComplianceCategoryService } from '../compliance-category/compliance-category.service';

@Controller('certification-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificationTypesController {
  constructor(
    @InjectRepository(CertificationType)
    private readonly repo: Repository<CertificationType>,
    private readonly complianceCategoryService: ComplianceCategoryService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  list(@Query('schoolId') schoolId: string | undefined) {
    if (!schoolId) return [];
    return this.repo.find({
      where: { schoolId },
      order: { name: 'ASC' },
      relations: ['complianceCategory'],
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  get(@Param('id') id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ['complianceCategory'],
    });
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
    },
    @CurrentUser() actor: { id: string },
  ) {
    const complianceCategoryId = await this.resolveComplianceCategoryId(
      body.schoolId,
      body as Record<string, unknown>,
      actor.id,
    );
    const row = this.repo.create({
      schoolId: body.schoolId,
      name: body.name?.trim(),
      description: body.description ?? null,
      defaultValidityMonths: body.defaultValidityMonths ?? 12,
      complianceCategoryId,
    } as any);
    return this.repo.save(row);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR)
  async update(@Param('id') id: string, @Body() body: any, @CurrentUser() actor: { id: string }) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) return null;
    if (body.name !== undefined) row.name = String(body.name).trim();
    if (body.description !== undefined) row.description = body.description ?? null;
    if (body.defaultValidityMonths !== undefined) row.defaultValidityMonths = body.defaultValidityMonths ?? null;
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


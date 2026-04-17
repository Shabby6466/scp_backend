import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionType } from '../../entities/inspection-type.entity';
import { InspectionCategory } from '../common/enums/database.enum';
import { ComplianceCategoryService } from '../compliance-category/compliance-category.service';

function parseCategory(raw: unknown): InspectionCategory {
  if (raw === InspectionCategory.DOH || raw === 'doh') return InspectionCategory.DOH;
  if (raw === InspectionCategory.FACILITY_SAFETY || raw === 'facility_safety')
    return InspectionCategory.FACILITY_SAFETY;
  return InspectionCategory.FACILITY_SAFETY;
}

/** Maps legacy inspection program / enum to ComplianceCategory.slug (four presets + future). */
function complianceSlugFromInspectionEnum(ic: InspectionCategory): string {
  if (ic === InspectionCategory.DOH) return 'doh';
  return 'facility-safety';
}

@Injectable()
export class InspectionTypeService {
  constructor(
    @InjectRepository(InspectionType)
    private readonly repository: Repository<InspectionType>,
    private readonly complianceCategoryService: ComplianceCategoryService,
  ) { }

  async findBySchool(schoolId: string) {
    return this.repository.find({
      where: { schoolId },
      order: { name: 'ASC' },
      relations: ['complianceCategory'],
    });
  }

  async findOne(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: ['complianceCategory'],
    });
  }

  /**
   * Resolves ComplianceCategory for this school: explicit id/slug, else derived from `category` (DOH vs facility).
   * Ensures default four categories exist when an actor id is provided and the row is missing.
   */
  private async resolveComplianceCategoryId(
    schoolId: string,
    body: Record<string, unknown>,
    inspectionEnum: InspectionCategory,
    actorUserId?: string,
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
      null;
    let slug = rawSlug?.trim().toLowerCase().replace(/_/g, '-') || null;
    if (!slug) {
      slug = complianceSlugFromInspectionEnum(inspectionEnum);
    }

    if (!slug) return null;

    let found = await this.complianceCategoryService.findOneBySchoolAndSlugInternal(
      schoolId,
      slug,
    );
    if (!found && actorUserId) {
      await this.complianceCategoryService.ensureDefaultCategoriesForSchool(
        schoolId,
        actorUserId,
      );
      found = await this.complianceCategoryService.findOneBySchoolAndSlugInternal(
        schoolId,
        slug,
      );
    }
    return found?.id ?? null;
  }

  async create(schoolId: string, body: any, actorUserId?: string) {
    const inspectionEnum = parseCategory(body.category);
    const complianceCategoryId = await this.resolveComplianceCategoryId(
      schoolId,
      body,
      inspectionEnum,
      actorUserId,
    );
    const row = this.repository.create({
      schoolId,
      name: body.name?.trim(),
      description: body.description ?? null,
      frequency: body.frequency ?? null,
      category: inspectionEnum,
      complianceCategoryId,
    } as any);
    return this.repository.save(row);
  }

  async update(id: string, body: any, actorUserId?: string) {
    const row = await this.repository.findOne({ where: { id } });
    if (!row) return null;
    if (body.name !== undefined) row.name = String(body.name).trim();
    if (body.description !== undefined) row.description = body.description ?? null;
    if (body.frequency !== undefined) row.frequency = body.frequency ?? null;
    let inspectionEnum = row.category;
    if (body.category !== undefined) {
      inspectionEnum = parseCategory(body.category);
      row.category = inspectionEnum;
    }
    if (
      body.complianceCategoryId !== undefined ||
      body.compliance_category_id !== undefined ||
      body.complianceCategorySlug !== undefined ||
      body.compliance_category_slug !== undefined ||
      body.category !== undefined
    ) {
      row.complianceCategoryId = await this.resolveComplianceCategoryId(
        row.schoolId,
        { ...body, category: body.category !== undefined ? body.category : row.category },
        inspectionEnum,
        actorUserId,
      );
    }
    return this.repository.save(row);
  }

  async remove(id: string) {
    await this.repository.delete(id);
    return { success: true };
  }
}

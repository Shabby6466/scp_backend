import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { InspectionType } from '../../entities/inspection-type.entity';
import { Branch } from '../../entities/branch.entity';
import { InspectionCategory, UserRole } from '../common/enums/database.enum';
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
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly complianceCategoryService: ComplianceCategoryService,
  ) { }

  private async assertBranchInSchool(
    branchId: string | null | undefined,
    schoolId: string,
  ): Promise<void> {
    if (branchId == null || branchId === '') return;
    const b = await this.branchRepository.findOne({ where: { id: branchId } });
    if (!b || b.schoolId !== schoolId) {
      throw new BadRequestException('Branch must belong to the school');
    }
  }

  async findBySchool(
    schoolId: string,
    viewer?: { role: UserRole; branchId: string | null },
  ) {
    const qb = this.repository
      .createQueryBuilder('it')
      .leftJoinAndSelect('it.complianceCategory', 'complianceCategory')
      .where('it.schoolId = :schoolId', { schoolId })
      .orderBy('it.name', 'ASC');

    if (viewer?.role === UserRole.BRANCH_DIRECTOR && viewer.branchId) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('it.branchId IS NULL').orWhere('it.branchId = :bid', {
            bid: viewer.branchId,
          });
        }),
      );
    }

    return qb.getMany();
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
    const rawBranch = body.branchId ?? body.branch_id ?? null;
    const branchId =
      rawBranch != null && String(rawBranch).trim() !== ''
        ? String(rawBranch).trim()
        : null;
    await this.assertBranchInSchool(branchId, schoolId);
    const inspectionEnum = parseCategory(body.category);
    const complianceCategoryId = await this.resolveComplianceCategoryId(
      schoolId,
      body,
      inspectionEnum,
      actorUserId,
    );
    const row = this.repository.create({
      schoolId,
      branchId,
      name: body.name?.trim(),
      description: body.description ?? null,
      frequency: body.frequency ?? null,
      category: inspectionEnum,
      complianceCategoryId,
    } as any);
    return this.repository.save(row);
  }

  async updateForSchool(
    schoolId: string,
    id: string,
    body: any,
    actorUserId?: string,
  ) {
    const row = await this.repository.findOne({ where: { id, schoolId } });
    if (!row) {
      throw new NotFoundException('Inspection type not found');
    }
    if (body.branchId !== undefined || body.branch_id !== undefined) {
      const raw = body.branchId ?? body.branch_id ?? null;
      const nextBranch =
        raw != null && String(raw).trim() !== '' ? String(raw).trim() : null;
      await this.assertBranchInSchool(nextBranch, schoolId);
      row.branchId = nextBranch;
    }
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

  async removeForSchool(schoolId: string, id: string) {
    const res = await this.repository.delete({ id, schoolId });
    if (!res.affected) {
      throw new NotFoundException('Inspection type not found');
    }
    return { success: true };
  }
}

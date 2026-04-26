import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { ComplianceRequirement } from '../../entities/compliance-requirement.entity';
import { InspectionType } from '../../entities/inspection-type.entity';
import { Branch } from '../../entities/branch.entity';
import { UserRole } from '../common/enums/database.enum';

@Injectable()
export class ComplianceRequirementService {
  constructor(
    @InjectRepository(ComplianceRequirement)
    private readonly repository: Repository<ComplianceRequirement>,
    @InjectRepository(InspectionType)
    private readonly inspectionTypeRepository: Repository<InspectionType>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  private async assertInspectionTypeBelongsToSchool(
    inspectionTypeId: string | null | undefined,
    schoolId: string,
  ): Promise<void> {
    if (inspectionTypeId == null || inspectionTypeId === '') return;
    const it = await this.inspectionTypeRepository.findOne({
      where: { id: inspectionTypeId, schoolId },
    });
    if (!it) {
      throw new BadRequestException(
        'Inspection type does not belong to this school',
      );
    }
  }

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

  private async syncBranchFromInspectionType(
    row: ComplianceRequirement,
    schoolId: string,
  ): Promise<void> {
    if (!row.inspectionTypeId) return;
    const it = await this.inspectionTypeRepository.findOne({
      where: { id: row.inspectionTypeId, schoolId },
    });
    if (it?.branchId) {
      if (row.branchId && row.branchId !== it.branchId) {
        throw new BadRequestException(
          'Requirement branch must match inspection type branch',
        );
      }
      row.branchId = it.branchId;
    }
  }

  async findBySchool(
    schoolId: string,
    viewer?: { role: UserRole; branchId: string | null },
  ) {
    const qb = this.repository
      .createQueryBuilder('cr')
      .leftJoinAndSelect('cr.inspectionType', 'inspectionType')
      .leftJoinAndSelect('cr.owner', 'owner')
      .leftJoinAndSelect('cr.createdBy', 'createdBy')
      .where('cr.schoolId = :schoolId', { schoolId })
      .orderBy('cr.updatedAt', 'DESC');

    if (viewer?.role === UserRole.BRANCH_DIRECTOR && viewer.branchId) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('cr.branchId IS NULL').orWhere('cr.branchId = :bid', {
            bid: viewer.branchId,
          });
        }),
      );
    }

    return qb.getMany();
  }

  async create(schoolId: string, body: any) {
    const inspectionTypeId =
      body.inspectionTypeId ?? body.inspection_type_id ?? null;
    await this.assertInspectionTypeBelongsToSchool(inspectionTypeId, schoolId);

    const rawBranch = body.branchId ?? body.branch_id ?? null;
    let branchId =
      rawBranch != null && String(rawBranch).trim() !== ''
        ? String(rawBranch).trim()
        : null;

    const row = this.repository.create({
      schoolId,
      branchId,
      name: body.name?.trim(),
      description: body.description ?? null,
      inspectionTypeId,
      ownerId: body.ownerId ?? body.owner_id ?? null,
      createdById: body.createdById ?? body.created_by_id ?? null,
    } as Partial<ComplianceRequirement>) as ComplianceRequirement;

    await this.syncBranchFromInspectionType(row, schoolId);
    await this.assertBranchInSchool(row.branchId, schoolId);

    return this.repository.save(row);
  }

  async updateForSchool(schoolId: string, id: string, body: any) {
    const row = await this.repository.findOne({ where: { id, schoolId } });
    if (!row) {
      throw new NotFoundException('Compliance requirement not found');
    }
    if (body.name !== undefined) row.name = String(body.name).trim();
    if (body.description !== undefined) row.description = body.description ?? null;
    if (body.inspectionTypeId !== undefined || body.inspection_type_id !== undefined) {
      const nextIt =
        body.inspectionTypeId ?? body.inspection_type_id ?? null;
      await this.assertInspectionTypeBelongsToSchool(nextIt, schoolId);
      row.inspectionTypeId = nextIt;
    }
    if (body.branchId !== undefined || body.branch_id !== undefined) {
      const raw = body.branchId ?? body.branch_id ?? null;
      row.branchId =
        raw != null && String(raw).trim() !== '' ? String(raw).trim() : null;
    }
    if (body.ownerId !== undefined || body.owner_id !== undefined) {
      row.ownerId = body.ownerId ?? body.owner_id ?? null;
    }

    await this.syncBranchFromInspectionType(row, schoolId);
    await this.assertBranchInSchool(row.branchId, schoolId);

    return this.repository.save(row);
  }

  async removeForSchool(schoolId: string, id: string) {
    const res = await this.repository.delete({ id, schoolId });
    if (!res.affected) {
      throw new NotFoundException('Compliance requirement not found');
    }
    return { success: true };
  }
}

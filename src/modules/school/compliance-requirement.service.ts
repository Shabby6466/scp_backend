import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceRequirement } from '../../entities/compliance-requirement.entity';

@Injectable()
export class ComplianceRequirementService {
  constructor(
    @InjectRepository(ComplianceRequirement)
    private readonly repository: Repository<ComplianceRequirement>,
  ) { }

  async findBySchool(schoolId: string) {
    return this.repository.find({
      where: { schoolId },
      order: { updatedAt: 'DESC' },
      relations: ['inspectionType', 'owner', 'createdBy'],
      select: {
        id: true,
        name: true,
        updatedAt: true,
        inspectionType: { id: true, name: true, frequency: true },
        owner: { id: true, name: true, email: true },
        createdBy: { id: true, name: true, email: true },
      },
    });
  }

  async create(schoolId: string, body: any) {
    const row = this.repository.create({
      schoolId,
      name: body.name?.trim(),
      description: body.description ?? null,
      inspectionTypeId: body.inspectionTypeId ?? body.inspection_type_id ?? null,
      ownerId: body.ownerId ?? body.owner_id ?? null,
      createdById: body.createdById ?? body.created_by_id ?? null,
    } as any);
    return this.repository.save(row);
  }

  async update(id: string, body: any) {
    const row = await this.repository.findOne({ where: { id } });
    if (!row) return null;
    if (body.name !== undefined) row.name = String(body.name).trim();
    if (body.description !== undefined) row.description = body.description ?? null;
    if (body.inspectionTypeId !== undefined || body.inspection_type_id !== undefined) {
      row.inspectionTypeId = body.inspectionTypeId ?? body.inspection_type_id ?? null;
    }
    if (body.ownerId !== undefined || body.owner_id !== undefined) {
      row.ownerId = body.ownerId ?? body.owner_id ?? null;
    }
    return this.repository.save(row);
  }

  async remove(id: string) {
    await this.repository.delete(id);
    return { success: true };
  }
}

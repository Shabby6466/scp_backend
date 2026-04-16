import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionType } from '../../entities/inspection-type.entity';
import { InspectionCategory } from '../common/enums/database.enum';

function parseCategory(raw: unknown): InspectionCategory {
  if (raw === InspectionCategory.DOH || raw === 'doh') return InspectionCategory.DOH;
  if (raw === InspectionCategory.FACILITY_SAFETY || raw === 'facility_safety')
    return InspectionCategory.FACILITY_SAFETY;
  return InspectionCategory.FACILITY_SAFETY;
}

@Injectable()
export class InspectionTypeService {
  constructor(
    @InjectRepository(InspectionType)
    private readonly repository: Repository<InspectionType>,
  ) { }

  async findBySchool(schoolId: string) {
    return this.repository.find({
      where: { schoolId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    return this.repository.findOne({ where: { id } });
  }

  async create(schoolId: string, body: any) {
    const row = this.repository.create({
      schoolId,
      name: body.name?.trim(),
      description: body.description ?? null,
      frequency: body.frequency ?? null,
      category: parseCategory(body.category),
    } as any);
    return this.repository.save(row);
  }

  async update(id: string, body: any) {
    const row = await this.repository.findOne({ where: { id } });
    if (!row) return null;
    if (body.name !== undefined) row.name = String(body.name).trim();
    if (body.description !== undefined) row.description = body.description ?? null;
    if (body.frequency !== undefined) row.frequency = body.frequency ?? null;
    if (body.category !== undefined) row.category = parseCategory(body.category);
    return this.repository.save(row);
  }

  async remove(id: string) {
    await this.repository.delete(id);
    return { success: true };
  }
}

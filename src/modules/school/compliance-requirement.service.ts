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
}

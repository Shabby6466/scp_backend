import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionType } from '../../entities/inspection-type.entity';

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
}

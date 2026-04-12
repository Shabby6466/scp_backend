import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CertificationRecord } from '../../entities/certification-record.entity';

@Injectable()
export class CertificationRecordService {
  constructor(
    @InjectRepository(CertificationRecord)
    private readonly repository: Repository<CertificationRecord>,
  ) { }

  async findBySchool(schoolId: string) {
    return this.repository.find({
      where: { schoolId },
      order: { updatedAt: 'DESC' },
      relations: ['certificationType'],
      select: {
        id: true,
        updatedAt: true,
        certificationType: { id: true, name: true, defaultValidityMonths: true },
      },
    });
  }
}

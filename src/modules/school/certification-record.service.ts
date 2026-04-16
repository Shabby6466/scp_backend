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

  async create(schoolId: string, body: any) {
    const row = this.repository.create({
      schoolId,
      certificationTypeId: body.certificationTypeId ?? body.certification_type_id,
      issueDate: body.issueDate ? new Date(body.issueDate) : null,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      referenceNumber: body.referenceNumber ?? null,
      documentUrl: body.documentUrl ?? null,
    } as any);
    return this.repository.save(row);
  }

  async update(id: string, body: any) {
    const row = await this.repository.findOne({ where: { id } });
    if (!row) return null;
    if (body.certificationTypeId !== undefined || body.certification_type_id !== undefined) {
      row.certificationTypeId = body.certificationTypeId ?? body.certification_type_id;
    }
    if (body.issueDate !== undefined) row.issueDate = body.issueDate ? new Date(body.issueDate) : null;
    if (body.expiryDate !== undefined) row.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
    if (body.referenceNumber !== undefined) row.referenceNumber = body.referenceNumber ?? null;
    if (body.documentUrl !== undefined) row.documentUrl = body.documentUrl ?? null;
    return this.repository.save(row);
  }

  async remove(id: string) {
    await this.repository.delete(id);
    return { success: true };
  }
}

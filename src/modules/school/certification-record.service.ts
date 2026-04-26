import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CertificationRecord } from '../../entities/certification-record.entity';
import { CertificationType } from '../../entities/certification-type.entity';
import { Branch } from '../../entities/branch.entity';
import { UserRole } from '../common/enums/database.enum';

@Injectable()
export class CertificationRecordService {
  constructor(
    @InjectRepository(CertificationRecord)
    private readonly repository: Repository<CertificationRecord>,
    @InjectRepository(CertificationType)
    private readonly certificationTypeRepository: Repository<CertificationType>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

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

  private async loadCertificationTypeInSchool(
    certificationTypeId: string,
    schoolId: string,
  ): Promise<CertificationType> {
    const t = await this.certificationTypeRepository.findOne({
      where: { id: certificationTypeId, schoolId },
    });
    if (!t) {
      throw new BadRequestException(
        'Certification type does not belong to this school',
      );
    }
    return t;
  }

  private async syncBranchFromCertificationType(
    row: CertificationRecord,
    schoolId: string,
  ): Promise<void> {
    const ct = await this.certificationTypeRepository.findOne({
      where: { id: row.certificationTypeId, schoolId },
    });
    if (!ct) return;
    if (ct.branchId) {
      if (row.branchId && row.branchId !== ct.branchId) {
        throw new BadRequestException(
          'Record branch must match certification type branch',
        );
      }
      row.branchId = ct.branchId;
    }
  }

  async findBySchool(
    schoolId: string,
    viewer?: { role: UserRole; branchId: string | null },
  ) {
    const qb = this.repository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.certificationType', 'certificationType')
      .where('r.schoolId = :schoolId', { schoolId })
      .orderBy('r.updatedAt', 'DESC');

    if (viewer?.role === UserRole.BRANCH_DIRECTOR && viewer.branchId) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('r.branchId IS NULL').orWhere('r.branchId = :bid', {
            bid: viewer.branchId,
          });
        }),
      );
    }

    return qb.getMany();
  }

  async create(schoolId: string, body: any) {
    const certificationTypeId =
      body.certificationTypeId ?? body.certification_type_id;
    if (!certificationTypeId) {
      throw new BadRequestException('certificationTypeId is required');
    }
    const ct = await this.loadCertificationTypeInSchool(
      certificationTypeId,
      schoolId,
    );

    const rawBranch = body.branchId ?? body.branch_id ?? null;
    let branchId =
      rawBranch != null && String(rawBranch).trim() !== ''
        ? String(rawBranch).trim()
        : null;

    if (ct.branchId) {
      if (branchId && branchId !== ct.branchId) {
        throw new BadRequestException(
          'Record branch must match certification type branch',
        );
      }
      branchId = ct.branchId;
    } else if (branchId) {
      await this.assertBranchInSchool(branchId, schoolId);
    }

    const row = this.repository.create({
      schoolId,
      branchId,
      certificationTypeId,
      issueDate: body.issueDate ? new Date(body.issueDate) : null,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      referenceNumber: body.referenceNumber ?? null,
      documentUrl: body.documentUrl ?? null,
    } as any);
    return this.repository.save(row);
  }

  async updateForSchool(schoolId: string, id: string, body: any) {
    const row = await this.repository.findOne({ where: { id, schoolId } });
    if (!row) {
      throw new NotFoundException('Certification record not found');
    }
    if (body.certificationTypeId !== undefined || body.certification_type_id !== undefined) {
      const nextTypeId =
        body.certificationTypeId ?? body.certification_type_id;
      await this.loadCertificationTypeInSchool(nextTypeId, schoolId);
      row.certificationTypeId = nextTypeId;
    }
    if (body.branchId !== undefined || body.branch_id !== undefined) {
      const raw = body.branchId ?? body.branch_id ?? null;
      row.branchId =
        raw != null && String(raw).trim() !== '' ? String(raw).trim() : null;
    }
    if (body.issueDate !== undefined) row.issueDate = body.issueDate ? new Date(body.issueDate) : null;
    if (body.expiryDate !== undefined) row.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
    if (body.referenceNumber !== undefined) row.referenceNumber = body.referenceNumber ?? null;
    if (body.documentUrl !== undefined) row.documentUrl = body.documentUrl ?? null;

    await this.syncBranchFromCertificationType(row, schoolId);
    await this.assertBranchInSchool(row.branchId, schoolId);

    return this.repository.save(row);
  }

  async removeForSchool(schoolId: string, id: string) {
    const res = await this.repository.delete({ id, schoolId });
    if (!res.affected) {
      throw new NotFoundException('Certification record not found');
    }
    return { success: true };
  }
}

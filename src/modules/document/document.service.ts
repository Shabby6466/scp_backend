import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In, IsNull } from 'typeorm';
import { UserRole, RenewalPeriod } from '../common/enums/database.enum';
import { Document, DocumentType } from '../../entities/document.entity';
import { StorageService } from '../storage/storage.service';
import { canManageBranchLikeDirector } from '../auth/school-scope.util';
import { PresignDto } from './dto/presign.dto';
import { CompleteDocumentDto } from './dto/complete.dto';
import PDFDocument from 'pdfkit';
import { MailerService } from '../mailer/mailer.service';
import { SearchDocumentDto } from './dto/search-document.dto';
import { UserService } from '../user/user.service';
import { DocumentTypeService } from '../document-type/document-type.service';
import { BranchService } from '../branch/branch.service';
import { StudentParentService } from '../student-parent/student-parent.service';

type CurrentUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

type EntityScope = { schoolId: string; branchId: string };

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @Inject(forwardRef(() => DocumentTypeService))
    private readonly documentTypeService: DocumentTypeService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => BranchService))
    private readonly branchService: BranchService,
    @Inject(forwardRef(() => StudentParentService))
    private readonly studentParent: StudentParentService,
    private readonly storage: StorageService,
    private readonly mailer: MailerService,
  ) { }

  async findSummaryDocsByOwnerIds(ownerIds: string[]) {
    return this.documentRepository.find({
      where: { ownerUserId: In(ownerIds) },
      select: {
        id: true,
        ownerUserId: true,
        documentTypeId: true,
        expiresAt: true,
      },
    });
  }

  async findRecentDocsByBranch(branchId: string, limit = 20) {
    return this.documentRepository.find({
      where: {
        ownerUser: { branchId },
      },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['documentType', 'uploadedBy'],
      select: {
        id: true,
        fileName: true,
        issuedAt: true,
        expiresAt: true,
        createdAt: true,
        documentType: { id: true, name: true, targetRole: true },
        uploadedBy: { id: true, name: true, email: true },
        ownerUserId: true,
      },
    });
  }

  async findComplianceDocsByOwnerIds(ownerIds: string[]) {
    return this.documentRepository.find({
      where: { ownerUserId: In(ownerIds) },
      select: {
        ownerUserId: true,
        documentTypeId: true,
        expiresAt: true,
      },
    });
  }

  async presign(
    dto: PresignDto,
    user: CurrentUser,
  ): Promise<{ uploadUrl: string; s3Key: string; uploadToken?: string }> {
    const { schoolId, branchId } = await this.resolveOwnerScope(
      dto.ownerUserId,
      user,
    );

    await this.documentTypeService.findOneInternal(dto.documentTypeId);

    const s3Key = this.storage.buildDocumentKey(
      schoolId,
      branchId,
      'user-doc',
      dto.ownerUserId,
      dto.fileName,
    );

    try {
      const { uploadUrl, uploadToken } =
        await this.storage.createPresignedUploadUrl(s3Key, dto.mimeType);

      return uploadToken !== undefined
        ? { uploadUrl, s3Key, uploadToken }
        : { uploadUrl, s3Key };
    } catch (err: any) {
      console.error('[DocumentService.presign] Storage failure:', err);
      throw new InternalServerErrorException(
        `Failed to generate upload URL: ${err.message}`,
      );
    }
  }

  async complete(dto: CompleteDocumentDto, user: CurrentUser) {
    const { schoolId, branchId } = await this.resolveOwnerScope(dto.ownerUserId, user);

    const docType = await this.documentTypeService.findOneInternal(dto.documentTypeId);
    if (!docType) throw new NotFoundException('Document type not found');

    let issuedAt: Date | null = null;
    if (dto.issuedAt?.trim()) {
      issuedAt = new Date(dto.issuedAt.trim());
    }

    let expiresAt: Date | null = null;
    if (dto.expiresAt) {
      expiresAt = new Date(dto.expiresAt);
    } else if (docType.renewalPeriod === RenewalPeriod.ANNUAL) {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      expiresAt = d;
    } else if (docType.renewalPeriod === RenewalPeriod.BIENNIAL) {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 2);
      expiresAt = d;
    }

    const created = this.documentRepository.create({
      documentTypeId: dto.documentTypeId,
      uploadedByUserId: user.id,
      ownerUserId: dto.ownerUserId,
      s3Key: dto.s3Key,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      issuedAt: issuedAt ?? undefined,
      expiresAt: expiresAt ?? undefined,
    });

    await this.documentRepository.save(created);

    const owner = await this.userService.findOneInternal(dto.ownerUserId);
    if (owner?.email) {
      await this.mailer.sendDocumentUploadedNotice(
        owner.email,
        docType.name,
      );
    }

    return this.documentRepository.findOne({
      where: { id: created.id },
      relations: ['documentType'],
    });
  }

  async listByOwner(ownerUserId: string, user: CurrentUser) {
    await this.ensureCanAccessDocumentOwner(ownerUserId, user);
    return this.documentRepository.find({
      where: { ownerUserId },
      relations: ['documentType'],
      order: { createdAt: 'DESC' },
    });
  }

  async searchDocuments(dto: SearchDocumentDto, user: CurrentUser) {
    const qb = this.documentRepository.createQueryBuilder('doc')
      .leftJoinAndSelect('doc.documentType', 'documentType')
      .leftJoinAndSelect('doc.ownerUser', 'ownerUser')
      .orderBy('doc.createdAt', 'DESC');

    // 1. Scoping
    if (user.role !== UserRole.ADMIN) {
      if (canManageBranchLikeDirector(user, { schoolId: user.schoolId || '', id: user.branchId || '' } as any)) {
        if (user.branchId) {
          qb.andWhere('ownerUser.branchId = :branchId', { branchId: user.branchId });
        } else if (user.schoolId) {
          qb.andWhere('ownerUser.schoolId = :schoolId', { schoolId: user.schoolId });
        }
      } else {
        qb.andWhere('doc.ownerUserId = :currentUserId', { currentUserId: user.id });
      }
    }

    // 2. Filters
    if (dto.query?.trim()) {
      const q = `%${dto.query.trim()}%`;
      qb.andWhere(new Brackets(inner => {
        inner.where('doc.fileName ILIKE :q', { q })
          .orWhere('ownerUser.name ILIKE :q', { q })
          .orWhere('ownerUser.email ILIKE :q', { q });
      }));
    }

    if (dto.schoolId && user.role === UserRole.ADMIN) {
      qb.andWhere('ownerUser.schoolId = :dtoSchoolId', { dtoSchoolId: dto.schoolId });
    }

    if (dto.branchId) {
      qb.andWhere('ownerUser.branchId = :dtoBranchId', { dtoBranchId: dto.branchId });
    }

    if (dto.documentTypeId) {
      qb.andWhere('doc.documentTypeId = :dtoDocTypeId', { dtoDocTypeId: dto.documentTypeId });
    }

    if (dto.verified !== undefined) {
      if (dto.verified) {
        qb.andWhere('doc.verifiedAt IS NOT NULL');
      } else {
        qb.andWhere('doc.verifiedAt IS NULL');
      }
    }

    if (dto.ownerRole) {
      qb.andWhere('ownerUser.role = :dtoOwnerRole', { dtoOwnerRole: dto.ownerRole });
    }

    if (dto.status?.trim()) {
      const s = dto.status.trim().toLowerCase();
      if (s === 'pending' || s === 'unverified') {
        qb.andWhere('doc.verifiedAt IS NULL');
      } else if (s === 'approved' || s === 'verified') {
        qb.andWhere('doc.verifiedAt IS NOT NULL');
      }
    }

    if (dto.limit != null) {
      qb.take(Math.min(Math.max(dto.limit, 1), 200));
    }
    if (dto.offset != null) {
      qb.skip(Math.max(dto.offset, 0));
    }

    return qb.getMany();
  }

  async getSummaryForOwner(ownerUserId: string, user: CurrentUser) {
    await this.ensureCanAccessDocumentOwner(ownerUserId, user);

    const requiredDocTypes = await this.userService.findRequiredDocTypesForUser(ownerUserId);

    const docs = await this.documentRepository.find({
      where: { ownerUserId },
      relations: ['documentType'],
      order: { createdAt: 'DESC' },
    });

    const latestByType = new Map<string, Document>();
    for (const doc of docs) {
      if (!latestByType.has(doc.documentTypeId)) {
        latestByType.set(doc.documentTypeId, doc);
      }
    }

    const items = (requiredDocTypes || []).map((docType) => {
      const latest = latestByType.get(docType.id) ?? null;
      return {
        documentType: docType,
        latestDocument: latest,
        remainingDays: latest?.expiresAt
          ? Math.max(
            0,
            Math.ceil(
              (latest.expiresAt.getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
            ),
          )
          : null,
      };
    });

    const assignedCount = items.length;
    const uploadedCount = items.filter(
      (item) => item.latestDocument != null,
    ).length;
    return {
      assignedCount,
      uploadedCount,
      remainingCount: assignedCount - uploadedCount,
      items,
    };
  }

  async getAssignedSummary(user: CurrentUser) {
    return this.getSummaryForOwner(user.id, user);
  }

  async getPerFormDetail(
    ownerUserId: string,
    documentTypeId: string,
    user: CurrentUser,
  ) {
    await this.ensureCanAccessDocumentOwner(ownerUserId, user);

    const owner = await this.userService.getUserDetail(ownerUserId, user);
    if (!owner) throw new NotFoundException('User not found');

    const assignedDocType = (owner.requiredDocTypes || []).find(dt => dt.id === documentTypeId) ?? null;

    const latestDocument = await this.documentRepository.findOne({
      where: { ownerUserId, documentTypeId },
      order: { createdAt: 'DESC' },
    });

    const remainingDays = latestDocument?.expiresAt
      ? Math.ceil(
        (latestDocument.expiresAt.getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
      )
      : null;

    return {
      owner: { id: owner.id, name: owner.name, email: owner.email },
      documentType: assignedDocType,
      latestDocument,
      uploadedDate: latestDocument?.createdAt ?? null,
      dueDate: latestDocument?.expiresAt ?? null,
      remainingDays,
    };
  }

  async verify(documentId: string, user: CurrentUser) {
    const doc = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['ownerUser', 'ownerUser.branch', 'documentType'],
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const branchId = doc.ownerUser.branchId;
    if (branchId) {
      await this.ensureCanManageBranch(branchId, user);
    } else if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Cannot verify this document');
    }

    doc.verifiedAt = new Date();
    await this.documentRepository.save(doc);

    if (
      doc.ownerUser.role === UserRole.TEACHER &&
      doc.documentType.targetRole === UserRole.TEACHER
    ) {
      await this.syncTeacherClearanceFromVerifiedDocs(doc.ownerUserId);
    }

    return doc;
  }

  async verifyMany(documentIds: string[], user: CurrentUser) {
    const results = [];
    for (const id of documentIds) {
      try {
        const updated = await this.verify(id, user);
        results.push(updated);
      } catch (err: any) {
        this.logger.error(`Failed to verify document ${id}: ${err.message}`);
      }
    }
    return { count: results.length, total: documentIds.length };
  }

  async nudge(ownerUserId: string, documentTypeId: string, user: CurrentUser) {
    await this.ensureCanAccessDocumentOwner(ownerUserId, user);

    const owner = await this.userService.findOneInternal(ownerUserId);
    if (!owner) throw new NotFoundException('User not found');

    const docType = await this.documentTypeService.findOneInternal(documentTypeId);
    if (!docType) throw new NotFoundException('Document type not found');

    if (owner.email) {
      await this.mailer.sendDocumentActionReminder(
        owner.email,
        owner.name ?? owner.email,
        docType.name,
      );
    }

    return { success: true };
  }

  private async syncTeacherClearanceFromVerifiedDocs(ownerUserId: string) {
    const staff = await this.userService.getUserDetail(ownerUserId, { role: UserRole.ADMIN } as any);
    if (!staff?.branchId || staff.role !== UserRole.TEACHER) return;

    if (!staff.staffPosition) {
      await this.userService.updateUser(ownerUserId, { staffClearanceActive: false } as any, { role: UserRole.ADMIN } as any);
      return;
    }

    const schoolId = staff.schoolId;
    if (!schoolId) return;

    const types = await this.documentTypeService.findAll({ targetRole: UserRole.TEACHER }, { role: UserRole.ADMIN } as any);

    const isClearanceType = (name: string) =>
      (name.includes('CBC') && name.includes('Background')) ||
      (name.includes('SCR') && name.includes('clearance')) ||
      (name.includes('PETS') && name.includes('eligible'));

    interface DocTypeLike { id: string; name: string; isMandatory: boolean; targetRole: UserRole; schoolId: string | null; }
    const clearanceIds = (types as unknown as DocTypeLike[])
      .filter((dt) => dt.isMandatory && isClearanceType(dt.name))
      .map((dt) => dt.id);
    if (clearanceIds.length === 0) return;

    const actuallyVerified = await this.documentRepository.createQueryBuilder('d')
      .where('d.ownerUserId = :ownerUserId', { ownerUserId })
      .andWhere('d.documentTypeId IN (:...clearanceIds)', { clearanceIds })
      .andWhere('d.verifiedAt IS NOT NULL')
      .getMany();

    const verifiedSet = new Set(actuallyVerified.map((d) => d.documentTypeId));
    const allClearancesVerified = clearanceIds.every((id) =>
      verifiedSet.has(id),
    );

    await this.userService.updateUser(ownerUserId, { staffClearanceActive: allClearancesVerified } as any, { role: UserRole.ADMIN } as any);
  }

  async findDocumentById(documentId: string, user: CurrentUser) {
    const doc = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['documentType', 'ownerUser', 'uploadedBy'],
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    await this.ensureCanAccessDocumentOwner(doc.ownerUserId, user);
    return doc;
  }

  async getDownloadUrl(documentId: string, user: CurrentUser): Promise<string> {
    const doc = await this.documentRepository.findOne({
      where: { id: documentId },
      select: { s3Key: true, ownerUserId: true },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    await this.ensureCanAccessDocumentOwner(doc.ownerUserId, user);

    return this.storage.createPresignedDownloadUrl(doc.s3Key);
  }

  async exportPerFormPdf(
    ownerUserId: string,
    documentTypeId: string,
    user: CurrentUser,
  ) {
    const detail = await this.getPerFormDetail(
      ownerUserId,
      documentTypeId,
      user,
    );
    const uploadedAtLabel = detail.uploadedDate
      ? new Date(detail.uploadedDate).toISOString().slice(0, 10)
      : 'Not uploaded';
    const dueDateLabel = detail.dueDate
      ? new Date(detail.dueDate).toISOString().slice(0, 10)
      : 'N/A';
    const remainingLabel =
      detail.remainingDays == null ? 'N/A' : `${detail.remainingDays} day(s)`;

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 48 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('Document Summary');
      doc.moveDown();
      doc
        .fontSize(12)
        .text(`Document type: ${detail.documentType?.name ?? 'Unknown'}`);
      doc.text(`Owner: ${detail.owner.name ?? detail.owner.email}`);
      doc.text(`Uploaded date: ${uploadedAtLabel}`);
      doc.text(`Due date: ${dueDateLabel}`);
      doc.text(`Remaining time: ${remainingLabel}`);
      doc.end();
    });
    const fileName = `document-${ownerUserId}-${documentTypeId}.pdf`;
    return { buffer, fileName };
  }

  private async resolveOwnerScope(
    ownerUserId: string,
    user: CurrentUser,
  ): Promise<EntityScope> {
    await this.ensureCanAccessDocumentOwner(ownerUserId, user);
    const owner = await this.userService.findOneInternal(ownerUserId);
    if (!owner) throw new NotFoundException('User not found');
    const branchId = owner.branchId;
    if (!branchId)
      throw new ForbiddenException('Owner must belong to a branch');

    const branch = await this.branchService.findOneById(branchId);
    if (!branch) throw new NotFoundException('Branch not found');
    return { schoolId: branch.schoolId, branchId: branch.id };
  }

  private async ensureCanAccessDocumentOwner(
    ownerUserId: string,
    user: CurrentUser,
  ) {
    if (user.role === UserRole.ADMIN) return;
    if (user.id === ownerUserId) return;

    const owner = await this.userService.findOneInternal(ownerUserId);
    if (!owner) throw new NotFoundException('User not found');

    const branchId = owner.branchId;
    if (!branchId) throw new ForbiddenException('User has no branch');

    const branch = await this.branchService.findOneById(branchId);
    if (!branch) throw new NotFoundException('Branch not found');

    if (canManageBranchLikeDirector(user, branch)) return;

    if (user.role === UserRole.PARENT) {
      if (await this.studentParent.isLinked(user.id, ownerUserId)) {
        return;
      }
    }

    throw new ForbiddenException('Cannot access this document');
  }

  private async ensureCanManageBranch(branchId: string, user: CurrentUser) {
    if (user.role === UserRole.ADMIN) return;

    const branch = await this.branchService.findOneById(branchId);
    if (!branch) throw new NotFoundException('Branch not found');

    if (canManageBranchLikeDirector(user, branch)) return;

    throw new ForbiddenException('Cannot manage this branch');
  }

  async countVerifiedInScope(scope: { schoolId?: string; branchId?: string }, now: Date) {
    const qb = this.documentRepository.createQueryBuilder('d')
      .innerJoin('d.ownerUser', 'owner')
      .where('d.verifiedAt IS NOT NULL')
      .andWhere('d.expiresAt > :now', { now });

    if (scope.branchId) {
      qb.andWhere('owner.branchId = :branchId', { branchId: scope.branchId });
    } else if (scope.schoolId) {
      qb.innerJoin('owner.branch', 'b').andWhere('b.schoolId = :schoolId', { schoolId: scope.schoolId });
    }
    return qb.getCount();
  }

  async countPendingInScope(scope: { schoolId?: string; branchId?: string }) {
    const qb = this.documentRepository.createQueryBuilder('d')
      .innerJoin('d.ownerUser', 'owner')
      .where('d.verifiedAt IS NULL');

    if (scope.branchId) {
      qb.andWhere('owner.branchId = :branchId', { branchId: scope.branchId });
    } else if (scope.schoolId) {
      qb.innerJoin('owner.branch', 'b').andWhere('b.schoolId = :schoolId', { schoolId: scope.schoolId });
    }
    return qb.getCount();
  }

  async countInSchool(schoolId: string) {
    return this.documentRepository.createQueryBuilder('d')
      .innerJoin('d.ownerUser', 'owner')
      .innerJoin('owner.branch', 'b')
      .where('b.schoolId = :schoolId', { schoolId })
      .getCount();
  }

  async countExpiredInScope(scope: { schoolId?: string; branchId?: string }, now: Date) {
    const qb = this.documentRepository.createQueryBuilder('d')
      .innerJoin('d.ownerUser', 'owner')
      .where('d.expiresAt < :now', { now });

    if (scope.branchId) {
      qb.andWhere('owner.branchId = :branchId', { branchId: scope.branchId });
    } else if (scope.schoolId) {
      qb.innerJoin('owner.branch', 'b').andWhere('b.schoolId = :schoolId', { schoolId: scope.schoolId });
    }
    return qb.getCount();
  }

  async countNearExpiryInScope(scope: { schoolId?: string; branchId?: string }, now: Date, nearEnd: Date) {
    const qb = this.documentRepository.createQueryBuilder('d')
      .innerJoin('d.ownerUser', 'owner')
      .where('d.expiresAt > :now AND d.expiresAt <= :nearEnd', { now, nearEnd });

    if (scope.branchId) {
      qb.andWhere('owner.branchId = :branchId', { branchId: scope.branchId });
    } else if (scope.schoolId) {
      qb.innerJoin('owner.branch', 'b').andWhere('b.schoolId = :schoolId', { schoolId: scope.schoolId });
    }
    return qb.getCount();
  }

  async findExpiringInScope(scope: { schoolId?: string; branchId?: string }, now: Date, until: Date, limit: number) {
    const qb = this.documentRepository.createQueryBuilder('d')
      .innerJoinAndSelect('d.documentType', 'dt')
      .innerJoinAndSelect('d.ownerUser', 'owner')
      .where('d.expiresAt > :now AND d.expiresAt <= :until', { now, until })
      .orderBy('d.expiresAt', 'ASC')
      .take(limit);

    if (scope.branchId) {
      qb.andWhere('owner.branchId = :branchId', { branchId: scope.branchId });
    } else if (scope.schoolId) {
      qb.innerJoin('owner.branch', 'b').andWhere('b.schoolId = :schoolId', { schoolId: scope.schoolId });
    }
    return qb.getMany();
  }

  async findExpiredInScope(scope: { schoolId?: string; branchId?: string }, now: Date, limit: number) {
    const qb = this.documentRepository.createQueryBuilder('d')
      .innerJoinAndSelect('d.documentType', 'dt')
      .innerJoinAndSelect('d.ownerUser', 'owner')
      .where('d.expiresAt < :now', { now })
      .orderBy('d.expiresAt', 'DESC')
      .take(limit);

    if (scope.branchId) {
      qb.andWhere('owner.branchId = :branchId', { branchId: scope.branchId });
    } else if (scope.schoolId) {
      qb.innerJoin('owner.branch', 'b').andWhere('b.schoolId = :schoolId', { schoolId: scope.schoolId });
    }
    return qb.getMany();
  }

  async findRecentUnverifiedInScope(scope: { schoolId?: string; branchId?: string }, limit: number) {
    const qb = this.documentRepository.createQueryBuilder('d')
      .leftJoinAndSelect('d.ownerUser', 'owner')
      .leftJoinAndSelect('d.documentType', 'dt')
      .where('d.verifiedAt IS NULL')
      .orderBy('d.createdAt', 'DESC')
      .take(limit);

    if (scope.branchId) {
      qb.andWhere('owner.branchId = :branchId', { branchId: scope.branchId });
    } else if (scope.schoolId) {
      qb.innerJoin('owner.branch', 'b').andWhere('b.schoolId = :schoolId', { schoolId: scope.schoolId });
    }
    return qb.getMany();
  }
}

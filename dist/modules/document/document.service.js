"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DocumentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const database_enum_1 = require("../common/enums/database.enum");
const document_entity_1 = require("../../entities/document.entity");
const storage_service_1 = require("../storage/storage.service");
const school_scope_util_1 = require("../auth/school-scope.util");
const pdfkit_1 = require("pdfkit");
const mailer_service_1 = require("../mailer/mailer.service");
const user_service_1 = require("../user/user.service");
const document_type_service_1 = require("../document-type/document-type.service");
const branch_service_1 = require("../branch/branch.service");
let DocumentService = DocumentService_1 = class DocumentService {
    constructor(documentRepository, documentTypeService, userService, branchService, storage, mailer) {
        this.documentRepository = documentRepository;
        this.documentTypeService = documentTypeService;
        this.userService = userService;
        this.branchService = branchService;
        this.storage = storage;
        this.mailer = mailer;
        this.logger = new common_1.Logger(DocumentService_1.name);
    }
    async findSummaryDocsByOwnerIds(ownerIds) {
        return this.documentRepository.find({
            where: { ownerUserId: (0, typeorm_2.In)(ownerIds) },
            select: {
                id: true,
                ownerUserId: true,
                documentTypeId: true,
                expiresAt: true,
            },
        });
    }
    async findRecentDocsByBranch(branchId, limit = 20) {
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
    async findComplianceDocsByOwnerIds(ownerIds) {
        return this.documentRepository.find({
            where: { ownerUserId: (0, typeorm_2.In)(ownerIds) },
            select: {
                ownerUserId: true,
                documentTypeId: true,
                expiresAt: true,
            },
        });
    }
    async presign(dto, user) {
        const { schoolId, branchId } = await this.resolveOwnerScope(dto.ownerUserId, user);
        await this.documentTypeService.findOneInternal(dto.documentTypeId);
        const s3Key = this.storage.buildDocumentKey(schoolId, branchId, 'user-doc', dto.ownerUserId, dto.fileName);
        try {
            const { uploadUrl, uploadToken } = await this.storage.createPresignedUploadUrl(s3Key, dto.mimeType);
            return uploadToken !== undefined
                ? { uploadUrl, s3Key, uploadToken }
                : { uploadUrl, s3Key };
        }
        catch (err) {
            console.error('[DocumentService.presign] Storage failure:', err);
            throw new common_1.InternalServerErrorException(`Failed to generate upload URL: ${err.message}`);
        }
    }
    async complete(dto, user) {
        const { schoolId, branchId } = await this.resolveOwnerScope(dto.ownerUserId, user);
        const docType = await this.documentTypeService.findOneInternal(dto.documentTypeId);
        if (!docType)
            throw new common_1.NotFoundException('Document type not found');
        let issuedAt = null;
        if (dto.issuedAt?.trim()) {
            issuedAt = new Date(dto.issuedAt.trim());
        }
        let expiresAt = null;
        if (dto.expiresAt) {
            expiresAt = new Date(dto.expiresAt);
        }
        else if (docType.renewalPeriod === database_enum_1.RenewalPeriod.ANNUAL) {
            const d = new Date();
            d.setFullYear(d.getFullYear() + 1);
            expiresAt = d;
        }
        else if (docType.renewalPeriod === database_enum_1.RenewalPeriod.BIENNIAL) {
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
            await this.mailer.sendDocumentUploadedNotice(owner.email, docType.name);
        }
        return this.documentRepository.findOne({
            where: { id: created.id },
            relations: ['documentType'],
        });
    }
    async listByOwner(ownerUserId, user) {
        await this.ensureCanAccessDocumentOwner(ownerUserId, user);
        return this.documentRepository.find({
            where: { ownerUserId },
            relations: ['documentType'],
            order: { createdAt: 'DESC' },
        });
    }
    async searchDocuments(dto, user) {
        const qb = this.documentRepository.createQueryBuilder('doc')
            .leftJoinAndSelect('doc.documentType', 'documentType')
            .leftJoinAndSelect('doc.ownerUser', 'ownerUser')
            .orderBy('doc.createdAt', 'DESC');
        if (user.role !== database_enum_1.UserRole.ADMIN) {
            if ((0, school_scope_util_1.canManageBranchLikeDirector)(user, { schoolId: user.schoolId || '', id: user.branchId || '' })) {
                if (user.branchId) {
                    qb.andWhere('ownerUser.branchId = :branchId', { branchId: user.branchId });
                }
                else if (user.schoolId) {
                    qb.andWhere('ownerUser.schoolId = :schoolId', { schoolId: user.schoolId });
                }
            }
            else {
                qb.andWhere('doc.ownerUserId = :currentUserId', { currentUserId: user.id });
            }
        }
        if (dto.query?.trim()) {
            const q = `%${dto.query.trim()}%`;
            qb.andWhere(new typeorm_2.Brackets(inner => {
                inner.where('doc.fileName ILIKE :q', { q })
                    .orWhere('ownerUser.name ILIKE :q', { q })
                    .orWhere('ownerUser.email ILIKE :q', { q });
            }));
        }
        if (dto.schoolId && user.role === database_enum_1.UserRole.ADMIN) {
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
            }
            else {
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
            }
            else if (s === 'approved' || s === 'verified') {
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
    async getSummaryForOwner(ownerUserId, user) {
        await this.ensureCanAccessDocumentOwner(ownerUserId, user);
        const requiredDocTypes = await this.userService.findRequiredDocTypesForUser(ownerUserId);
        const docs = await this.documentRepository.find({
            where: { ownerUserId },
            relations: ['documentType'],
            order: { createdAt: 'DESC' },
        });
        const latestByType = new Map();
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
                    ? Math.max(0, Math.ceil((latest.expiresAt.getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)))
                    : null,
            };
        });
        const assignedCount = items.length;
        const uploadedCount = items.filter((item) => item.latestDocument != null).length;
        return {
            assignedCount,
            uploadedCount,
            remainingCount: assignedCount - uploadedCount,
            items,
        };
    }
    async getAssignedSummary(user) {
        return this.getSummaryForOwner(user.id, user);
    }
    async getPerFormDetail(ownerUserId, documentTypeId, user) {
        await this.ensureCanAccessDocumentOwner(ownerUserId, user);
        const owner = await this.userService.getUserDetail(ownerUserId, user);
        if (!owner)
            throw new common_1.NotFoundException('User not found');
        const assignedDocType = (owner.requiredDocTypes || []).find(dt => dt.id === documentTypeId) ?? null;
        const latestDocument = await this.documentRepository.findOne({
            where: { ownerUserId, documentTypeId },
            order: { createdAt: 'DESC' },
        });
        const remainingDays = latestDocument?.expiresAt
            ? Math.ceil((latestDocument.expiresAt.getTime() - Date.now()) /
                (1000 * 60 * 60 * 24))
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
    async verify(documentId, user) {
        const doc = await this.documentRepository.findOne({
            where: { id: documentId },
            relations: ['ownerUser', 'ownerUser.branch', 'documentType'],
        });
        if (!doc) {
            throw new common_1.NotFoundException('Document not found');
        }
        const branchId = doc.ownerUser.branchId;
        if (branchId) {
            await this.ensureCanManageBranch(branchId, user);
        }
        else if (user.role !== database_enum_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Cannot verify this document');
        }
        doc.verifiedAt = new Date();
        await this.documentRepository.save(doc);
        if (doc.ownerUser.role === database_enum_1.UserRole.TEACHER &&
            doc.documentType.targetRole === database_enum_1.UserRole.TEACHER) {
            await this.syncTeacherClearanceFromVerifiedDocs(doc.ownerUserId);
        }
        return doc;
    }
    async verifyMany(documentIds, user) {
        const results = [];
        for (const id of documentIds) {
            try {
                const updated = await this.verify(id, user);
                results.push(updated);
            }
            catch (err) {
                this.logger.error(`Failed to verify document ${id}: ${err.message}`);
            }
        }
        return { count: results.length, total: documentIds.length };
    }
    async nudge(ownerUserId, documentTypeId, user) {
        await this.ensureCanAccessDocumentOwner(ownerUserId, user);
        const owner = await this.userService.findOneInternal(ownerUserId);
        if (!owner)
            throw new common_1.NotFoundException('User not found');
        const docType = await this.documentTypeService.findOneInternal(documentTypeId);
        if (!docType)
            throw new common_1.NotFoundException('Document type not found');
        if (owner.email) {
            await this.mailer.sendDocumentActionReminder(owner.email, owner.name ?? owner.email, docType.name);
        }
        return { success: true };
    }
    async syncTeacherClearanceFromVerifiedDocs(ownerUserId) {
        const staff = await this.userService.getUserDetail(ownerUserId, { role: database_enum_1.UserRole.ADMIN });
        if (!staff?.branchId || staff.role !== database_enum_1.UserRole.TEACHER)
            return;
        if (!staff.staffPosition) {
            await this.userService.updateUser(ownerUserId, { staffClearanceActive: false }, { role: database_enum_1.UserRole.ADMIN });
            return;
        }
        const schoolId = staff.schoolId;
        if (!schoolId)
            return;
        const types = await this.documentTypeService.findAll({ targetRole: database_enum_1.UserRole.TEACHER }, { role: database_enum_1.UserRole.ADMIN });
        const isClearanceType = (name) => (name.includes('CBC') && name.includes('Background')) ||
            (name.includes('SCR') && name.includes('clearance')) ||
            (name.includes('PETS') && name.includes('eligible'));
        const clearanceIds = types
            .filter((dt) => dt.isMandatory && isClearanceType(dt.name))
            .map((dt) => dt.id);
        if (clearanceIds.length === 0)
            return;
        const actuallyVerified = await this.documentRepository.createQueryBuilder('d')
            .where('d.ownerUserId = :ownerUserId', { ownerUserId })
            .andWhere('d.documentTypeId IN (:...clearanceIds)', { clearanceIds })
            .andWhere('d.verifiedAt IS NOT NULL')
            .getMany();
        const verifiedSet = new Set(actuallyVerified.map((d) => d.documentTypeId));
        const allClearancesVerified = clearanceIds.every((id) => verifiedSet.has(id));
        await this.userService.updateUser(ownerUserId, { staffClearanceActive: allClearancesVerified }, { role: database_enum_1.UserRole.ADMIN });
    }
    async findDocumentById(documentId, user) {
        const doc = await this.documentRepository.findOne({
            where: { id: documentId },
            relations: ['documentType', 'ownerUser', 'uploadedBy'],
        });
        if (!doc) {
            throw new common_1.NotFoundException('Document not found');
        }
        await this.ensureCanAccessDocumentOwner(doc.ownerUserId, user);
        return doc;
    }
    async getDownloadUrl(documentId, user) {
        const doc = await this.documentRepository.findOne({
            where: { id: documentId },
            select: { s3Key: true, ownerUserId: true },
        });
        if (!doc) {
            throw new common_1.NotFoundException('Document not found');
        }
        await this.ensureCanAccessDocumentOwner(doc.ownerUserId, user);
        return this.storage.createPresignedDownloadUrl(doc.s3Key);
    }
    async exportPerFormPdf(ownerUserId, documentTypeId, user) {
        const detail = await this.getPerFormDetail(ownerUserId, documentTypeId, user);
        const uploadedAtLabel = detail.uploadedDate
            ? new Date(detail.uploadedDate).toISOString().slice(0, 10)
            : 'Not uploaded';
        const dueDateLabel = detail.dueDate
            ? new Date(detail.dueDate).toISOString().slice(0, 10)
            : 'N/A';
        const remainingLabel = detail.remainingDays == null ? 'N/A' : `${detail.remainingDays} day(s)`;
        const buffer = await new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ size: 'A4', margin: 48 });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
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
    async resolveOwnerScope(ownerUserId, user) {
        await this.ensureCanAccessDocumentOwner(ownerUserId, user);
        const owner = await this.userService.findOneInternal(ownerUserId);
        if (!owner)
            throw new common_1.NotFoundException('User not found');
        const branchId = owner.branchId;
        if (!branchId)
            throw new common_1.ForbiddenException('Owner must belong to a branch');
        const branch = await this.branchService.findOneById(branchId);
        if (!branch)
            throw new common_1.NotFoundException('Branch not found');
        return { schoolId: branch.schoolId, branchId: branch.id };
    }
    async ensureCanAccessDocumentOwner(ownerUserId, user) {
        if (user.role === database_enum_1.UserRole.ADMIN)
            return;
        if (user.id === ownerUserId)
            return;
        const owner = await this.userService.findOneInternal(ownerUserId);
        if (!owner)
            throw new common_1.NotFoundException('User not found');
        const branchId = owner.branchId;
        if (!branchId)
            throw new common_1.ForbiddenException('User has no branch');
        const branch = await this.branchService.findOneById(branchId);
        if (!branch)
            throw new common_1.NotFoundException('Branch not found');
        if ((0, school_scope_util_1.canManageBranchLikeDirector)(user, branch))
            return;
        throw new common_1.ForbiddenException('Cannot access this document');
    }
    async ensureCanManageBranch(branchId, user) {
        if (user.role === database_enum_1.UserRole.ADMIN)
            return;
        const branch = await this.branchService.findOneById(branchId);
        if (!branch)
            throw new common_1.NotFoundException('Branch not found');
        if ((0, school_scope_util_1.canManageBranchLikeDirector)(user, branch))
            return;
        throw new common_1.ForbiddenException('Cannot manage this branch');
    }
    async countVerifiedInScope(scope, now) {
        const qb = this.documentRepository.createQueryBuilder('d')
            .innerJoin('d.ownerUser', 'owner')
            .where('d.verifiedAt IS NOT NULL')
            .andWhere('d.expiresAt > :now', { now });
        if (scope.branchId) {
            qb.andWhere('owner.branchId = :branchId', { branchId: scope.branchId });
        }
        else if (scope.schoolId) {
            qb.innerJoin('owner.branch', 'b').andWhere('b.schoolId = :schoolId', { schoolId: scope.schoolId });
        }
        return qb.getCount();
    }
    async countPendingInScope(scope) {
        const qb = this.documentRepository.createQueryBuilder('d')
            .innerJoin('d.ownerUser', 'owner')
            .where('d.verifiedAt IS NULL');
        if (scope.branchId) {
            qb.andWhere('owner.branchId = :branchId', { branchId: scope.branchId });
        }
        else if (scope.schoolId) {
            qb.innerJoin('owner.branch', 'b').andWhere('b.schoolId = :schoolId', { schoolId: scope.schoolId });
        }
        return qb.getCount();
    }
    async countInSchool(schoolId) {
        return this.documentRepository.createQueryBuilder('d')
            .innerJoin('d.ownerUser', 'owner')
            .innerJoin('owner.branch', 'b')
            .where('b.schoolId = :schoolId', { schoolId })
            .getCount();
    }
    async countExpiredInScope(scope, now) {
        const qb = this.documentRepository.createQueryBuilder('d')
            .innerJoin('d.ownerUser', 'owner')
            .where('d.expiresAt < :now', { now });
        if (scope.branchId) {
            qb.andWhere('owner.branchId = :branchId', { branchId: scope.branchId });
        }
        else if (scope.schoolId) {
            qb.innerJoin('owner.branch', 'b').andWhere('b.schoolId = :schoolId', { schoolId: scope.schoolId });
        }
        return qb.getCount();
    }
    async countNearExpiryInScope(scope, now, nearEnd) {
        const qb = this.documentRepository.createQueryBuilder('d')
            .innerJoin('d.ownerUser', 'owner')
            .where('d.expiresAt > :now AND d.expiresAt <= :nearEnd', { now, nearEnd });
        if (scope.branchId) {
            qb.andWhere('owner.branchId = :branchId', { branchId: scope.branchId });
        }
        else if (scope.schoolId) {
            qb.innerJoin('owner.branch', 'b').andWhere('b.schoolId = :schoolId', { schoolId: scope.schoolId });
        }
        return qb.getCount();
    }
    async findExpiringInScope(scope, now, until, limit) {
        const qb = this.documentRepository.createQueryBuilder('d')
            .innerJoinAndSelect('d.documentType', 'dt')
            .innerJoinAndSelect('d.ownerUser', 'owner')
            .where('d.expiresAt > :now AND d.expiresAt <= :until', { now, until })
            .orderBy('d.expiresAt', 'ASC')
            .take(limit);
        if (scope.branchId) {
            qb.andWhere('owner.branchId = :branchId', { branchId: scope.branchId });
        }
        else if (scope.schoolId) {
            qb.innerJoin('owner.branch', 'b').andWhere('b.schoolId = :schoolId', { schoolId: scope.schoolId });
        }
        return qb.getMany();
    }
    async findExpiredInScope(scope, now, limit) {
        const qb = this.documentRepository.createQueryBuilder('d')
            .innerJoinAndSelect('d.documentType', 'dt')
            .innerJoinAndSelect('d.ownerUser', 'owner')
            .where('d.expiresAt < :now', { now })
            .orderBy('d.expiresAt', 'DESC')
            .take(limit);
        if (scope.branchId) {
            qb.andWhere('owner.branchId = :branchId', { branchId: scope.branchId });
        }
        else if (scope.schoolId) {
            qb.innerJoin('owner.branch', 'b').andWhere('b.schoolId = :schoolId', { schoolId: scope.schoolId });
        }
        return qb.getMany();
    }
    async findRecentUnverifiedInScope(scope, limit) {
        const qb = this.documentRepository.createQueryBuilder('d')
            .leftJoinAndSelect('d.ownerUser', 'owner')
            .leftJoinAndSelect('d.documentType', 'dt')
            .where('d.verifiedAt IS NULL')
            .orderBy('d.createdAt', 'DESC')
            .take(limit);
        if (scope.branchId) {
            qb.andWhere('owner.branchId = :branchId', { branchId: scope.branchId });
        }
        else if (scope.schoolId) {
            qb.innerJoin('owner.branch', 'b').andWhere('b.schoolId = :schoolId', { schoolId: scope.schoolId });
        }
        return qb.getMany();
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = DocumentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(document_entity_1.Document)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => document_type_service_1.DocumentTypeService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_service_1.UserService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => branch_service_1.BranchService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        document_type_service_1.DocumentTypeService,
        user_service_1.UserService,
        branch_service_1.BranchService,
        storage_service_1.StorageService,
        mailer_service_1.MailerService])
], DocumentService);
//# sourceMappingURL=document.service.js.map
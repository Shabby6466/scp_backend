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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DocumentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const storage_service_js_1 = require("../storage/storage.service.js");
const school_scope_util_js_1 = require("../auth/school-scope.util.js");
const pdfkit_1 = __importDefault(require("pdfkit"));
const mailer_service_js_1 = require("../mailer/mailer.service.js");
let DocumentService = DocumentService_1 = class DocumentService {
    prisma;
    storage;
    mailer;
    logger = new common_1.Logger(DocumentService_1.name);
    constructor(prisma, storage, mailer) {
        this.prisma = prisma;
        this.storage = storage;
        this.mailer = mailer;
    }
    async presign(dto, user) {
        const { schoolId, branchId } = await this.resolveOwnerScope(dto.ownerUserId, user);
        await this.prisma.documentType.findUniqueOrThrow({
            where: { id: dto.documentTypeId },
        });
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
        await this.resolveOwnerScope(dto.ownerUserId, user);
        const docType = await this.prisma.documentType.findUniqueOrThrow({
            where: { id: dto.documentTypeId },
        });
        let issuedAt = null;
        if (dto.issuedAt?.trim()) {
            issuedAt = new Date(dto.issuedAt.trim());
        }
        let expiresAt = null;
        if (dto.expiresAt) {
            expiresAt = new Date(dto.expiresAt);
        }
        else if (docType.renewalPeriod === 'ANNUAL') {
            const d = new Date();
            d.setFullYear(d.getFullYear() + 1);
            expiresAt = d;
        }
        else if (docType.renewalPeriod === 'BIENNIAL') {
            const d = new Date();
            d.setFullYear(d.getFullYear() + 2);
            expiresAt = d;
        }
        const created = await this.prisma.document.create({
            data: {
                documentType: { connect: { id: dto.documentTypeId } },
                uploadedBy: { connect: { id: user.id } },
                ownerUser: { connect: { id: dto.ownerUserId } },
                s3Key: dto.s3Key,
                fileName: dto.fileName,
                mimeType: dto.mimeType,
                sizeBytes: dto.sizeBytes,
                issuedAt: issuedAt ?? undefined,
                expiresAt: expiresAt ?? undefined,
            },
            include: {
                documentType: {
                    select: { id: true, name: true, targetRole: true },
                },
            },
        });
        const owner = await this.prisma.user.findUnique({
            where: { id: dto.ownerUserId },
            select: { email: true },
        });
        if (owner?.email) {
            await this.mailer.sendDocumentUploadedNotice(owner.email, created.documentType.name);
        }
        return created;
    }
    async listByOwner(ownerUserId, user) {
        await this.ensureCanAccessDocumentOwner(ownerUserId, user);
        return this.prisma.document.findMany({
            where: { ownerUserId },
            include: {
                documentType: {
                    select: {
                        id: true,
                        name: true,
                        targetRole: true,
                        isMandatory: true,
                        renewalPeriod: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async searchDocuments(dto, user) {
        const where = { AND: [] };
        const and = where.AND;
        if (user.role !== client_1.UserRole.ADMIN) {
            if ((0, school_scope_util_js_1.canManageBranchLikeDirector)(user, { schoolId: user.schoolId || '', id: user.branchId || '' })) {
                if (user.branchId) {
                    and.push({ ownerUser: { branchId: user.branchId } });
                }
                else if (user.schoolId) {
                    and.push({ ownerUser: { schoolId: user.schoolId } });
                }
            }
            else {
                and.push({ ownerUserId: user.id });
            }
        }
        if (dto.query?.trim()) {
            const q = dto.query.trim();
            and.push({
                OR: [
                    { fileName: { contains: q, mode: 'insensitive' } },
                    { ownerUser: { name: { contains: q, mode: 'insensitive' } } },
                    { ownerUser: { email: { contains: q, mode: 'insensitive' } } },
                ],
            });
        }
        if (dto.schoolId && user.role === client_1.UserRole.ADMIN) {
            and.push({ ownerUser: { schoolId: dto.schoolId } });
        }
        if (dto.branchId) {
            and.push({ ownerUser: { branchId: dto.branchId } });
        }
        if (dto.documentTypeId) {
            and.push({ documentTypeId: dto.documentTypeId });
        }
        if (dto.verified !== undefined) {
            if (dto.verified) {
                and.push({ verifiedAt: { not: null } });
            }
            else {
                and.push({ verifiedAt: null });
            }
        }
        if (dto.ownerRole) {
            and.push({ ownerUser: { role: dto.ownerRole } });
        }
        if (dto.status?.trim()) {
            const s = dto.status.trim().toLowerCase();
            if (s === 'pending' || s === 'unverified') {
                and.push({ verifiedAt: null });
            }
            else if (s === 'approved' || s === 'verified') {
                and.push({ verifiedAt: { not: null } });
            }
        }
        const take = dto.limit != null ? Math.min(Math.max(dto.limit, 1), 200) : undefined;
        const skip = dto.offset != null ? Math.max(dto.offset, 0) : undefined;
        return this.prisma.document.findMany({
            where,
            include: {
                documentType: true,
                ownerUser: {
                    select: { id: true, name: true, email: true, role: true, branchId: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
        });
    }
    async getSummaryForOwner(ownerUserId, user) {
        await this.ensureCanAccessDocumentOwner(ownerUserId, user);
        const me = await this.prisma.user.findUniqueOrThrow({
            where: { id: ownerUserId },
            select: {
                requiredDocTypes: {
                    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                },
            },
        });
        const docs = await this.prisma.document.findMany({
            where: { ownerUserId },
            include: {
                documentType: {
                    select: {
                        id: true,
                        name: true,
                        renewalPeriod: true,
                        isMandatory: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const latestByType = new Map();
        for (const doc of docs) {
            if (!latestByType.has(doc.documentTypeId)) {
                latestByType.set(doc.documentTypeId, doc);
            }
        }
        const items = me.requiredDocTypes.map((docType) => {
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
        const me = await this.prisma.user.findUniqueOrThrow({
            where: { id: user.id },
            select: {
                requiredDocTypes: {
                    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                },
            },
        });
        const docs = await this.prisma.document.findMany({
            where: { ownerUserId: user.id },
            include: {
                documentType: {
                    select: {
                        id: true,
                        name: true,
                        renewalPeriod: true,
                        isMandatory: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const latestByType = new Map();
        for (const doc of docs) {
            if (!latestByType.has(doc.documentTypeId)) {
                latestByType.set(doc.documentTypeId, doc);
            }
        }
        const items = me.requiredDocTypes.map((docType) => {
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
    async getPerFormDetail(ownerUserId, documentTypeId, user) {
        await this.ensureCanAccessDocumentOwner(ownerUserId, user);
        const owner = await this.prisma.user.findUniqueOrThrow({
            where: { id: ownerUserId },
            select: {
                id: true,
                name: true,
                email: true,
                requiredDocTypes: {
                    where: { id: documentTypeId },
                    select: {
                        id: true,
                        name: true,
                        renewalPeriod: true,
                        targetRole: true,
                    },
                },
            },
        });
        const assignedDocType = owner.requiredDocTypes[0] ?? null;
        const documents = await this.prisma.document.findMany({
            where: { ownerUserId, documentTypeId },
            orderBy: { createdAt: 'desc' },
            take: 1,
        });
        const latestDocument = documents[0] ?? null;
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
        const doc = await this.prisma.document.findUnique({
            where: { id: documentId },
            include: {
                ownerUser: { include: { branch: true } },
                documentType: true,
            },
        });
        if (!doc) {
            throw new common_1.NotFoundException('Document not found');
        }
        const branchId = doc.ownerUser.branchId;
        if (branchId) {
            await this.ensureCanManageBranch(branchId, user);
        }
        else if (user.role !== client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Cannot verify this document');
        }
        const updated = await this.prisma.document.update({
            where: { id: documentId },
            data: { verifiedAt: new Date() },
            include: {
                documentType: {
                    select: { id: true, name: true, targetRole: true },
                },
            },
        });
        if (doc.ownerUser.role === client_1.UserRole.TEACHER &&
            doc.documentType.targetRole === client_1.UserRole.TEACHER) {
            await this.syncTeacherClearanceFromVerifiedDocs(doc.ownerUserId);
        }
        return updated;
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
        const owner = await this.prisma.user.findUniqueOrThrow({
            where: { id: ownerUserId },
            select: { email: true, name: true },
        });
        const docType = await this.prisma.documentType.findUniqueOrThrow({
            where: { id: documentTypeId },
            select: { name: true },
        });
        if (owner.email) {
            await this.mailer.sendDocumentActionReminder(owner.email, owner.name ?? owner.email, docType.name);
        }
        return { success: true };
    }
    async syncTeacherClearanceFromVerifiedDocs(ownerUserId) {
        const staff = await this.prisma.user.findUnique({
            where: { id: ownerUserId },
            include: { branch: true },
        });
        if (!staff?.branchId || staff.role !== client_1.UserRole.TEACHER)
            return;
        const position = staff.staffPosition;
        if (!position) {
            await this.prisma.user.update({
                where: { id: ownerUserId },
                data: { staffClearanceActive: false },
            });
            return;
        }
        const schoolId = staff.branch?.schoolId;
        if (!schoolId)
            return;
        const types = await this.prisma.documentType.findMany({
            where: {
                targetRole: client_1.UserRole.TEACHER,
                OR: [{ schoolId: null }, { schoolId }],
            },
            select: {
                id: true,
                name: true,
                isMandatory: true,
            },
        });
        const isClearanceType = (name) => (name.includes('CBC') && name.includes('Background')) ||
            (name.includes('SCR') && name.includes('clearance')) ||
            (name.includes('PETS') && name.includes('eligible'));
        const clearanceIds = types
            .filter((dt) => dt.isMandatory && isClearanceType(dt.name))
            .map((dt) => dt.id);
        if (clearanceIds.length === 0)
            return;
        const verifiedDocs = await this.prisma.document.findMany({
            where: {
                ownerUserId,
                verifiedAt: { not: null },
                documentTypeId: { in: clearanceIds },
            },
            select: { documentTypeId: true },
        });
        const verifiedSet = new Set(verifiedDocs.map((d) => d.documentTypeId));
        const allClearancesVerified = clearanceIds.every((id) => verifiedSet.has(id));
        await this.prisma.user.update({
            where: { id: ownerUserId },
            data: { staffClearanceActive: allClearancesVerified },
        });
    }
    async findDocumentById(documentId, user) {
        const doc = await this.prisma.document.findUnique({
            where: { id: documentId },
            include: {
                documentType: {
                    select: {
                        id: true,
                        name: true,
                        targetRole: true,
                        renewalPeriod: true,
                    },
                },
                ownerUser: {
                    select: { id: true, name: true, email: true, role: true },
                },
                uploadedBy: { select: { id: true, name: true, email: true } },
            },
        });
        if (!doc) {
            throw new common_1.NotFoundException('Document not found');
        }
        await this.ensureCanAccessDocumentOwner(doc.ownerUserId, user);
        return doc;
    }
    async getDownloadUrl(documentId, user) {
        const doc = await this.prisma.document.findUnique({
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
        const owner = await this.prisma.user.findUniqueOrThrow({
            where: { id: ownerUserId },
            include: { branch: true },
        });
        const branchId = owner.branchId;
        if (!branchId)
            throw new common_1.ForbiddenException('Owner must belong to a branch');
        const branch = owner.branch ??
            (await this.prisma.branch.findUniqueOrThrow({ where: { id: branchId } }));
        return { schoolId: branch.schoolId, branchId: branch.id };
    }
    async ensureCanAccessDocumentOwner(ownerUserId, user) {
        if (user.role === client_1.UserRole.ADMIN)
            return;
        if (user.id === ownerUserId)
            return;
        const owner = await this.prisma.user.findUniqueOrThrow({
            where: { id: ownerUserId },
            include: { branch: true },
        });
        const branchId = owner.branchId;
        if (!branchId)
            throw new common_1.ForbiddenException('User has no branch');
        const branch = owner.branch ??
            (await this.prisma.branch.findUnique({ where: { id: branchId } }));
        if (!branch)
            throw new common_1.ForbiddenException('Branch not found');
        if ((0, school_scope_util_js_1.canManageBranchLikeDirector)(user, branch))
            return;
        throw new common_1.ForbiddenException('Cannot access this document');
    }
    async ensureCanManageBranch(branchId, user) {
        if (user.role === client_1.UserRole.ADMIN)
            return;
        const branch = await this.prisma.branch.findUniqueOrThrow({
            where: { id: branchId },
        });
        if ((0, school_scope_util_js_1.canManageBranchLikeDirector)(user, branch))
            return;
        throw new common_1.ForbiddenException('Cannot manage this branch');
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = DocumentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        storage_service_js_1.StorageService,
        mailer_service_js_1.MailerService])
], DocumentService);
//# sourceMappingURL=document.service.js.map
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentTypeService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const mailer_service_js_1 = require("../mailer/mailer.service.js");
const docTypeInclude = {
    school: { select: { id: true, name: true } },
    branch: { select: { id: true, name: true } },
    complianceCategory: { select: { id: true, name: true, slug: true } },
};
let DocumentTypeService = class DocumentTypeService {
    prisma;
    mailer;
    constructor(prisma, mailer) {
        this.prisma = prisma;
        this.mailer = mailer;
    }
    canAssignRole(actorRole, targetRole) {
        if (targetRole === client_1.UserRole.ADMIN || targetRole === client_1.UserRole.DIRECTOR) {
            return false;
        }
        if (actorRole === client_1.UserRole.ADMIN) {
            return true;
        }
        if (actorRole === client_1.UserRole.DIRECTOR) {
            return (targetRole === client_1.UserRole.BRANCH_DIRECTOR ||
                targetRole === client_1.UserRole.TEACHER ||
                targetRole === client_1.UserRole.STUDENT);
        }
        if (actorRole === client_1.UserRole.BRANCH_DIRECTOR) {
            return targetRole === client_1.UserRole.TEACHER || targetRole === client_1.UserRole.STUDENT;
        }
        return false;
    }
    assertActorCanAccessDocType(actor, docType) {
        if (actor.role === client_1.UserRole.ADMIN) {
            return;
        }
        if (!actor.schoolId) {
            throw new common_1.ForbiddenException('Your account is not linked to a school');
        }
        if (docType.schoolId && docType.schoolId !== actor.schoolId) {
            throw new common_1.ForbiddenException('Document type is outside your school');
        }
        if (actor.role === client_1.UserRole.DIRECTOR) {
            return;
        }
        if (actor.role === client_1.UserRole.BRANCH_DIRECTOR) {
            if (!actor.branchId) {
                throw new common_1.ForbiddenException('Your account is not linked to a branch');
            }
            if (!docType.branchId) {
                return;
            }
            if (docType.branchId !== actor.branchId) {
                throw new common_1.ForbiddenException('Document type is outside your branch');
            }
            return;
        }
        if (actor.role === client_1.UserRole.TEACHER || actor.role === client_1.UserRole.STUDENT) {
            if (docType.schoolId !== actor.schoolId) {
                throw new common_1.ForbiddenException('Document type is outside your school');
            }
            if (!docType.branchId) {
                return;
            }
            if (actor.branchId && docType.branchId === actor.branchId) {
                return;
            }
            if (!actor.branchId) {
                throw new common_1.ForbiddenException('Document type is scoped to a branch');
            }
            if (docType.branchId !== actor.branchId) {
                throw new common_1.ForbiddenException('Document type is outside your branch');
            }
            return;
        }
        throw new common_1.ForbiddenException('Cannot access this document type');
    }
    ensureScope(actor, target) {
        if (actor.role === client_1.UserRole.ADMIN)
            return;
        if (!actor.schoolId) {
            throw new common_1.ForbiddenException('Your account is not linked to a school');
        }
        if (target.schoolId !== actor.schoolId) {
            throw new common_1.ForbiddenException('Target user is outside your school scope');
        }
        if (actor.role === client_1.UserRole.BRANCH_DIRECTOR &&
            actor.branchId !== target.branchId) {
            throw new common_1.ForbiddenException('Target user is outside your branch scope');
        }
    }
    async create(dto, user) {
        if (!this.canAssignRole(user.role, dto.targetRole)) {
            throw new common_1.ForbiddenException('You cannot create doc types for this role');
        }
        let schoolId = null;
        let branchId = null;
        if (user.role === client_1.UserRole.ADMIN) {
            schoolId = dto.schoolId ?? null;
            branchId = dto.branchId ?? null;
            if (branchId) {
                if (!schoolId) {
                    throw new common_1.BadRequestException('schoolId is required when branchId is set');
                }
                const b = await this.prisma.branch.findUnique({
                    where: { id: branchId },
                });
                if (!b || b.schoolId !== schoolId) {
                    throw new common_1.BadRequestException('Branch does not belong to the selected school');
                }
            }
        }
        else if (user.role === client_1.UserRole.DIRECTOR) {
            schoolId = user.schoolId ?? null;
            branchId = null;
            if (!schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a school');
            }
            if (dto.schoolId && dto.schoolId !== schoolId) {
                throw new common_1.ForbiddenException('Cannot create document type outside your school');
            }
            if (dto.branchId) {
                throw new common_1.ForbiddenException('Directors create school-wide document types only');
            }
        }
        else if (user.role === client_1.UserRole.BRANCH_DIRECTOR) {
            schoolId = user.schoolId;
            branchId = user.branchId;
            if (!schoolId || !branchId) {
                throw new common_1.ForbiddenException('Your account must be linked to a school and branch');
            }
        }
        else {
            throw new common_1.ForbiddenException('Cannot create document types');
        }
        if (dto.complianceCategoryId) {
            const cat = await this.prisma.complianceCategory.findUnique({
                where: { id: dto.complianceCategoryId },
            });
            if (!cat) {
                throw new common_1.BadRequestException('Compliance category not found');
            }
            if (cat.schoolId !== schoolId) {
                throw new common_1.BadRequestException('Compliance category does not belong to the same school');
            }
        }
        return this.prisma.documentType.create({
            data: {
                name: dto.name.trim(),
                targetRole: dto.targetRole,
                renewalPeriod: dto.renewalPeriod ?? client_1.RenewalPeriod.NONE,
                schoolId,
                branchId,
                complianceCategoryId: dto.complianceCategoryId || null,
                createdById: user.id,
            },
            include: docTypeInclude,
        });
    }
    async update(id, dto, user) {
        const existing = await this.prisma.documentType.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Document type not found');
        }
        this.assertActorCanAccessDocType(user, existing);
        if (dto.targetRole !== undefined) {
            if (!this.canAssignRole(user.role, dto.targetRole)) {
                throw new common_1.ForbiddenException('You cannot set this target role');
            }
        }
        if (dto.complianceCategoryId !== undefined && dto.complianceCategoryId !== null) {
            const cat = await this.prisma.complianceCategory.findUnique({
                where: { id: dto.complianceCategoryId },
            });
            if (!cat)
                throw new common_1.BadRequestException('Compliance category not found');
            if (existing.schoolId && cat.schoolId !== existing.schoolId) {
                throw new common_1.BadRequestException('Compliance category does not belong to the same school');
            }
        }
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name.trim();
        if (dto.renewalPeriod !== undefined)
            data.renewalPeriod = dto.renewalPeriod;
        if (dto.isMandatory !== undefined)
            data.isMandatory = dto.isMandatory;
        if (dto.targetRole !== undefined)
            data.targetRole = dto.targetRole;
        if (dto.complianceCategoryId !== undefined) {
            data.complianceCategory = dto.complianceCategoryId
                ? { connect: { id: dto.complianceCategoryId } }
                : { disconnect: true };
        }
        if (Object.keys(data).length === 0) {
            return this.prisma.documentType.findUniqueOrThrow({
                where: { id },
                include: docTypeInclude,
            });
        }
        return this.prisma.documentType.update({
            where: { id },
            data,
            include: docTypeInclude,
        });
    }
    async assignUsers(documentTypeId, userIds, user) {
        const docType = await this.prisma.documentType.findUnique({
            where: { id: documentTypeId },
            select: {
                id: true,
                name: true,
                targetRole: true,
                schoolId: true,
                branchId: true,
                createdById: true,
            },
        });
        if (!docType)
            throw new common_1.NotFoundException('Document type not found');
        this.assertActorCanAccessDocType(user, docType);
        const targets = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                email: true,
                role: true,
                schoolId: true,
                branchId: true,
            },
        });
        if (targets.length !== userIds.length) {
            throw new common_1.BadRequestException('Some users were not found');
        }
        for (const target of targets) {
            if (!this.canAssignRole(user.role, target.role)) {
                throw new common_1.ForbiddenException(`Cannot assign documents to role ${target.role}`);
            }
            this.ensureScope(user, target);
            if (docType.targetRole && target.role !== docType.targetRole) {
                throw new common_1.BadRequestException('Target user role does not match document type target role');
            }
            if (docType.branchId && target.branchId !== docType.branchId) {
                throw new common_1.BadRequestException('This document type is limited to a specific branch; pick users from that branch.');
            }
        }
        await this.prisma.documentType.update({
            where: { id: documentTypeId },
            data: {
                requiredUsers: {
                    connect: targets.map((target) => ({ id: target.id })),
                },
            },
        });
        await Promise.allSettled(targets.map((target) => target.email
            ? this.mailer.sendDocTypeAssigned(target.email, docType.name)
            : Promise.resolve()));
        return this.getAssignees(documentTypeId, user);
    }
    async unassignUser(documentTypeId, userId, user) {
        const docType = await this.prisma.documentType.findUnique({
            where: { id: documentTypeId },
            select: { schoolId: true, branchId: true },
        });
        if (!docType)
            throw new common_1.NotFoundException('Document type not found');
        this.assertActorCanAccessDocType(user, docType);
        const target = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, schoolId: true, branchId: true },
        });
        if (!target)
            throw new common_1.NotFoundException('User not found');
        if (!this.canAssignRole(user.role, target.role)) {
            throw new common_1.ForbiddenException(`Cannot unassign documents from role ${target.role}`);
        }
        this.ensureScope(user, target);
        await this.prisma.documentType.update({
            where: { id: documentTypeId },
            data: {
                requiredUsers: {
                    disconnect: { id: userId },
                },
            },
        });
        return this.getAssignees(documentTypeId, user);
    }
    async getAssignedForCurrentUser(user) {
        const me = await this.prisma.user.findUniqueOrThrow({
            where: { id: user.id },
            select: {
                id: true,
                requiredDocTypes: {
                    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
                },
            },
        });
        return me.requiredDocTypes;
    }
    async getAssignees(documentTypeId, user) {
        const docType = await this.prisma.documentType.findUnique({
            where: { id: documentTypeId },
            select: {
                id: true,
                name: true,
                targetRole: true,
                schoolId: true,
                branchId: true,
                requiredUsers: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        schoolId: true,
                        branchId: true,
                    },
                    orderBy: [{ role: 'asc' }, { email: 'asc' }],
                },
            },
        });
        if (!docType)
            throw new common_1.NotFoundException('Document type not found');
        this.assertActorCanAccessDocType(user, docType);
        let requiredUsers = docType.requiredUsers;
        if (user.role === client_1.UserRole.BRANCH_DIRECTOR && user.branchId) {
            requiredUsers = requiredUsers.filter((u) => u.branchId === user.branchId);
        }
        return { ...docType, requiredUsers };
    }
    async findAll(filters, user) {
        const where = {};
        if (filters.targetRole) {
            where.targetRole = filters.targetRole;
        }
        if (user.role === client_1.UserRole.ADMIN) {
            if (filters.schoolId) {
                where.schoolId = filters.schoolId;
            }
            if (filters.branchId) {
                where.branchId = filters.branchId;
            }
        }
        else if (user.role === client_1.UserRole.DIRECTOR) {
            if (!user.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a school');
            }
            where.schoolId = user.schoolId;
        }
        else if (user.role === client_1.UserRole.BRANCH_DIRECTOR) {
            if (!user.schoolId || !user.branchId) {
                throw new common_1.ForbiddenException('Your account must be linked to a school and branch');
            }
            where.AND = [
                { schoolId: user.schoolId },
                {
                    OR: [{ branchId: null }, { branchId: user.branchId }],
                },
            ];
        }
        else if (user.role === client_1.UserRole.TEACHER ||
            user.role === client_1.UserRole.STUDENT) {
            if (!user.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a school');
            }
            const branchOr = [{ branchId: null }];
            if (user.branchId) {
                branchOr.push({ branchId: user.branchId });
            }
            where.AND = [{ schoolId: user.schoolId }, { OR: branchOr }];
        }
        else {
            throw new common_1.ForbiddenException('Cannot list document types');
        }
        return this.prisma.documentType.findMany({
            where,
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            include: docTypeInclude,
        });
    }
    async findOne(id, user) {
        const docType = await this.prisma.documentType.findUnique({
            where: { id },
            include: docTypeInclude,
        });
        if (!docType) {
            throw new common_1.NotFoundException('Document type not found');
        }
        this.assertActorCanAccessDocType(user, docType);
        return docType;
    }
};
exports.DocumentTypeService = DocumentTypeService;
exports.DocumentTypeService = DocumentTypeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        mailer_service_js_1.MailerService])
], DocumentTypeService);
//# sourceMappingURL=document-type.service.js.map
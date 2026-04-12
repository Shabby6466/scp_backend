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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentTypeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const document_entity_1 = require("../../entities/document.entity");
const database_enum_1 = require("../common/enums/database.enum");
const mailer_service_1 = require("../mailer/mailer.service");
const user_service_1 = require("../user/user.service");
const compliance_category_service_1 = require("../compliance-category/compliance-category.service");
const branch_service_1 = require("../branch/branch.service");
let DocumentTypeService = class DocumentTypeService {
    constructor(documentTypeRepository, userService, categoryService, branchService, mailer) {
        this.documentTypeRepository = documentTypeRepository;
        this.userService = userService;
        this.categoryService = categoryService;
        this.branchService = branchService;
        this.mailer = mailer;
    }
    canAssignRole(actorRole, targetRole) {
        if (targetRole === database_enum_1.UserRole.ADMIN || targetRole === database_enum_1.UserRole.DIRECTOR) {
            return false;
        }
        if (actorRole === database_enum_1.UserRole.ADMIN) {
            return true;
        }
        if (actorRole === database_enum_1.UserRole.DIRECTOR) {
            return (targetRole === database_enum_1.UserRole.BRANCH_DIRECTOR ||
                targetRole === database_enum_1.UserRole.TEACHER ||
                targetRole === database_enum_1.UserRole.STUDENT);
        }
        if (actorRole === database_enum_1.UserRole.BRANCH_DIRECTOR) {
            return targetRole === database_enum_1.UserRole.TEACHER || targetRole === database_enum_1.UserRole.STUDENT;
        }
        return false;
    }
    assertActorCanAccessDocType(actor, docType) {
        if (actor.role === database_enum_1.UserRole.ADMIN) {
            return;
        }
        if (!actor.schoolId) {
            throw new common_1.ForbiddenException('Your account is not linked to a school');
        }
        if (docType.schoolId && docType.schoolId !== actor.schoolId) {
            throw new common_1.ForbiddenException('Document type is outside your school');
        }
        if (actor.role === database_enum_1.UserRole.DIRECTOR) {
            return;
        }
        if (actor.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
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
        if (actor.role === database_enum_1.UserRole.TEACHER || actor.role === database_enum_1.UserRole.STUDENT) {
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
        if (actor.role === database_enum_1.UserRole.ADMIN)
            return;
        if (!actor.schoolId) {
            throw new common_1.ForbiddenException('Your account is not linked to a school');
        }
        if (target.schoolId !== actor.schoolId) {
            throw new common_1.ForbiddenException('Target user is outside your school scope');
        }
        if (actor.role === database_enum_1.UserRole.BRANCH_DIRECTOR &&
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
        if (user.role === database_enum_1.UserRole.ADMIN) {
            schoolId = dto.schoolId ?? null;
            branchId = dto.branchId ?? null;
            if (branchId) {
                if (!schoolId) {
                    throw new common_1.BadRequestException('schoolId is required when branchId is set');
                }
                const b = await this.branchService.findOneById(branchId);
                if (!b || b.schoolId !== schoolId) {
                    throw new common_1.BadRequestException('Branch does not belong to the selected school');
                }
            }
        }
        else if (user.role === database_enum_1.UserRole.DIRECTOR) {
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
        else if (user.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
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
            const cat = await this.categoryService.findOneInternal(dto.complianceCategoryId);
            if (!cat) {
                throw new common_1.BadRequestException('Compliance category not found');
            }
            if (cat.schoolId !== schoolId) {
                throw new common_1.BadRequestException('Compliance category does not belong to the same school');
            }
        }
        const docType = this.documentTypeRepository.create({
            name: dto.name.trim(),
            targetRole: dto.targetRole,
            renewalPeriod: dto.renewalPeriod ?? database_enum_1.RenewalPeriod.NONE,
            schoolId,
            branchId,
            categoryId: dto.complianceCategoryId || null,
            createdById: user.id,
        });
        return this.documentTypeRepository.save(docType);
    }
    async update(id, dto, user) {
        const existing = await this.documentTypeRepository.findOne({
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
            existing.targetRole = dto.targetRole;
        }
        if (dto.complianceCategoryId !== undefined && dto.complianceCategoryId !== null) {
            const cat = await this.categoryService.findOneInternal(dto.complianceCategoryId);
            if (!cat)
                throw new common_1.BadRequestException('Compliance category not found');
            if (existing.schoolId && cat.schoolId !== existing.schoolId) {
                throw new common_1.BadRequestException('Compliance category does not belong to the same school');
            }
            existing.categoryId = dto.complianceCategoryId;
        }
        else if (dto.complianceCategoryId === null) {
            existing.categoryId = null;
        }
        if (dto.name !== undefined)
            existing.name = dto.name.trim();
        if (dto.renewalPeriod !== undefined)
            existing.renewalPeriod = dto.renewalPeriod;
        if (dto.isMandatory !== undefined)
            existing.isMandatory = dto.isMandatory;
        return this.documentTypeRepository.save(existing);
    }
    async assignUsers(documentTypeId, userIds, user) {
        const docType = await this.documentTypeRepository.findOne({
            where: { id: documentTypeId },
            relations: ['requiredUsers'],
        });
        if (!docType)
            throw new common_1.NotFoundException('Document type not found');
        this.assertActorCanAccessDocType(user, docType);
        const targets = await this.userService.findUsersByIds(userIds);
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
        const existingIds = new Set(docType.requiredUsers?.map(u => u.id) || []);
        const toAdd = targets.filter(t => !existingIds.has(t.id));
        if (toAdd.length > 0) {
            docType.requiredUsers = [...(docType.requiredUsers || []), ...toAdd];
            await this.documentTypeRepository.save(docType);
            await Promise.allSettled(toAdd.map((target) => target.email
                ? this.mailer.sendDocTypeAssigned(target.email, docType.name)
                : Promise.resolve()));
        }
        return this.getAssignees(documentTypeId, user);
    }
    async unassignUser(documentTypeId, userId, user) {
        const docType = await this.documentTypeRepository.findOne({
            where: { id: documentTypeId },
            relations: ['requiredUsers'],
        });
        if (!docType)
            throw new common_1.NotFoundException('Document type not found');
        this.assertActorCanAccessDocType(user, docType);
        const target = await this.userService.findOneInternal(userId);
        if (!target)
            throw new common_1.NotFoundException('User not found');
        if (!this.canAssignRole(user.role, target.role)) {
            throw new common_1.ForbiddenException(`Cannot unassign documents from role ${target.role}`);
        }
        this.ensureScope(user, target);
        if (docType.requiredUsers) {
            docType.requiredUsers = docType.requiredUsers.filter(u => u.id !== userId);
            await this.documentTypeRepository.save(docType);
        }
        return this.getAssignees(documentTypeId, user);
    }
    async getAssignedForCurrentUser(user) {
        return this.userService.findRequiredDocTypesForUser(user.id);
    }
    async getAssignees(documentTypeId, user) {
        const docType = await this.documentTypeRepository.findOne({
            where: { id: documentTypeId },
            relations: ['requiredUsers'],
        });
        if (!docType)
            throw new common_1.NotFoundException('Document type not found');
        this.assertActorCanAccessDocType(user, docType);
        let requiredUsers = docType.requiredUsers || [];
        if (user.role === database_enum_1.UserRole.BRANCH_DIRECTOR && user.branchId) {
            requiredUsers = requiredUsers.filter((u) => u.branchId === user.branchId);
        }
        return { ...docType, requiredUsers };
    }
    async findAll(filters, user) {
        const where = {};
        if (filters.targetRole) {
            where.targetRole = filters.targetRole;
        }
        if (user.role === database_enum_1.UserRole.ADMIN) {
            if (filters.schoolId) {
                where.schoolId = filters.schoolId;
            }
            if (filters.branchId) {
                where.branchId = filters.branchId;
            }
        }
        else if (user.role === database_enum_1.UserRole.DIRECTOR) {
            if (!user.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a school');
            }
            where.schoolId = user.schoolId;
        }
        else if (user.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
            if (!user.schoolId || !user.branchId) {
                throw new common_1.ForbiddenException('Your account must be linked to a school and branch');
            }
            where.schoolId = user.schoolId;
            return this.documentTypeRepository.find({
                where: [
                    { schoolId: user.schoolId, branchId: (0, typeorm_2.IsNull)() },
                    { schoolId: user.schoolId, branchId: user.branchId },
                ],
                order: { sortOrder: 'ASC', createdAt: 'DESC' },
                relations: ['category'],
            });
        }
        else if (user.role === database_enum_1.UserRole.TEACHER ||
            user.role === database_enum_1.UserRole.STUDENT) {
            if (!user.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a school');
            }
            const findOptions = {
                where: [
                    { schoolId: user.schoolId, branchId: (0, typeorm_2.IsNull)() },
                ],
                order: { sortOrder: 'ASC', createdAt: 'DESC' },
                relations: ['category']
            };
            if (user.branchId) {
                findOptions.where.push({ schoolId: user.schoolId, branchId: user.branchId });
            }
            return this.documentTypeRepository.find(findOptions);
        }
        else {
            throw new common_1.ForbiddenException('Cannot list document types');
        }
        return this.documentTypeRepository.find({
            where,
            order: { sortOrder: 'ASC', createdAt: 'DESC' },
            relations: ['category'],
        });
    }
    async findOne(id, user) {
        const docType = await this.documentTypeRepository.findOne({
            where: { id },
            relations: ['category'],
        });
        if (!docType) {
            throw new common_1.NotFoundException('Document type not found');
        }
        this.assertActorCanAccessDocType(user, docType);
        return docType;
    }
    async findMandatory() {
        return this.documentTypeRepository.find({
            where: { isMandatory: true },
            select: ['id', 'targetRole'],
        });
    }
    async findOneInternal(id) {
        return this.documentTypeRepository.findOne({ where: { id } });
    }
};
exports.DocumentTypeService = DocumentTypeService;
exports.DocumentTypeService = DocumentTypeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(document_entity_1.DocumentType)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_service_1.UserService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => compliance_category_service_1.ComplianceCategoryService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => branch_service_1.BranchService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        user_service_1.UserService,
        compliance_category_service_1.ComplianceCategoryService,
        branch_service_1.BranchService,
        mailer_service_1.MailerService])
], DocumentTypeService);
//# sourceMappingURL=document-type.service.js.map
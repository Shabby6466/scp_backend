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
exports.ComplianceCategoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const compliance_category_entity_1 = require("../../entities/compliance-category.entity");
const database_enum_1 = require("../common/enums/database.enum");
const school_service_1 = require("../school/school.service");
const user_service_1 = require("../user/user.service");
let ComplianceCategoryService = class ComplianceCategoryService {
    constructor(categoryRepository, schoolService, userService) {
        this.categoryRepository = categoryRepository;
        this.schoolService = schoolService;
        this.userService = userService;
    }
    async create(dto, user) {
        if (user.role !== database_enum_1.UserRole.ADMIN && user.role !== database_enum_1.UserRole.DIRECTOR) {
            throw new common_1.ForbiddenException('Only admins and directors can create compliance categories');
        }
        let schoolId;
        if (user.role === database_enum_1.UserRole.ADMIN) {
            if (!dto.schoolId) {
                throw new common_1.BadRequestException('schoolId is required when creating as admin');
            }
            const school = await this.schoolService.findOneInternal(dto.schoolId);
            if (!school)
                throw new common_1.NotFoundException('School not found');
            schoolId = dto.schoolId;
        }
        else {
            if (!user.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a school');
            }
            schoolId = user.schoolId;
        }
        const slug = dto.slug
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-');
        const existing = await this.categoryRepository.findOne({
            where: { schoolId, slug },
        });
        if (existing) {
            throw new common_1.BadRequestException(`A category with slug "${slug}" already exists for this school`);
        }
        const category = this.categoryRepository.create({
            name: dto.name.trim(),
            slug,
            description: dto.description?.trim() || null,
            icon: dto.icon || null,
            sortOrder: dto.sortOrder ?? 0,
            schoolId,
            createdById: user.id,
        });
        return this.categoryRepository.save(category);
    }
    async update(id, dto, user) {
        const category = await this.categoryRepository.findOne({
            where: { id },
        });
        if (!category)
            throw new common_1.NotFoundException('Compliance category not found');
        this.assertAccess(user, category.schoolId);
        if (dto.name !== undefined)
            category.name = dto.name.trim();
        if (dto.description !== undefined)
            category.description = dto.description?.trim() || null;
        if (dto.icon !== undefined)
            category.icon = dto.icon || null;
        if (dto.sortOrder !== undefined)
            category.sortOrder = dto.sortOrder;
        return this.categoryRepository.save(category);
    }
    async delete(id, user) {
        const category = await this.categoryRepository.findOne({
            where: { id },
            relations: ['documentTypes'],
        });
        if (!category)
            throw new common_1.NotFoundException('Compliance category not found');
        this.assertAccess(user, category.schoolId);
        if (category.documentTypes && category.documentTypes.length > 0) {
            throw new common_1.BadRequestException('Cannot delete a category that has document types linked to it. Unlink the document types first.');
        }
        await this.categoryRepository.remove(category);
        return { deleted: true };
    }
    async findAll(user, schoolId) {
        const where = {};
        if (user.role === database_enum_1.UserRole.ADMIN) {
            if (schoolId)
                where.schoolId = schoolId;
        }
        else {
            if (!user.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a school');
            }
            where.schoolId = user.schoolId;
        }
        return this.categoryRepository.find({
            where,
            order: { sortOrder: 'ASC', name: 'ASC' },
            relations: ['school', 'createdBy'],
        });
    }
    async findOne(id, user) {
        const category = await this.categoryRepository.findOne({
            where: { id },
            relations: ['school', 'createdBy'],
        });
        if (!category)
            throw new common_1.NotFoundException('Compliance category not found');
        this.assertAccess(user, category.schoolId);
        return category;
    }
    async findOneInternal(id) {
        return this.categoryRepository.findOne({ where: { id } });
    }
    async findBySlug(slug, user) {
        if (!user.schoolId && user.role !== database_enum_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Your account is not linked to a school');
        }
        const schoolId = user.schoolId;
        if (!schoolId) {
            throw new common_1.BadRequestException('schoolId is required for slug-based lookup');
        }
        const category = await this.categoryRepository.findOne({
            where: { schoolId, slug },
            relations: ['school', 'createdBy'],
        });
        if (!category)
            throw new common_1.NotFoundException('Compliance category not found');
        return category;
    }
    async getScore(id, user) {
        const category = await this.categoryRepository.findOne({
            where: { id },
            relations: [
                'documentTypes',
                'documentTypes.requiredUsers',
                'documentTypes.documents',
            ],
        });
        if (!category)
            throw new common_1.NotFoundException('Compliance category not found');
        this.assertAccess(user, category.schoolId);
        const now = new Date();
        const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
        let totalSlots = 0;
        let satisfiedSlots = 0;
        let expiringSoon = 0;
        let expired = 0;
        const byRole = {};
        for (const docType of category.documentTypes || []) {
            for (const requiredUser of docType.requiredUsers || []) {
                totalSlots++;
                const role = requiredUser.role;
                if (!byRole[role])
                    byRole[role] = { total: 0, satisfied: 0 };
                byRole[role].total++;
                const userDocs = (docType.documents || []).filter((d) => d.ownerUserId === requiredUser.id);
                const validDoc = userDocs.find((d) => d.expiresAt === null || d.expiresAt > now);
                if (validDoc) {
                    satisfiedSlots++;
                    byRole[role].satisfied++;
                    if (validDoc.expiresAt &&
                        validDoc.expiresAt > now &&
                        validDoc.expiresAt <= sixtyDaysFromNow) {
                        expiringSoon++;
                    }
                }
                const hasExpiredDoc = userDocs.some((d) => d.expiresAt && d.expiresAt <= now) && !validDoc;
                if (hasExpiredDoc)
                    expired++;
            }
        }
        const score = totalSlots > 0 ? (satisfiedSlots / totalSlots) * 100 : 0;
        return {
            categoryId: id,
            categoryName: category.name,
            categorySlug: category.slug,
            totalSlots,
            satisfiedSlots,
            score: Math.round(score * 10) / 10,
            expiringSoon,
            expired,
            byRole,
        };
    }
    assertAccess(user, schoolId) {
        if (user.role === database_enum_1.UserRole.ADMIN)
            return;
        if (!user.schoolId) {
            throw new common_1.ForbiddenException('Your account is not linked to a school');
        }
        if (user.schoolId !== schoolId) {
            throw new common_1.ForbiddenException('Category is outside your school');
        }
    }
};
exports.ComplianceCategoryService = ComplianceCategoryService;
exports.ComplianceCategoryService = ComplianceCategoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(compliance_category_entity_1.ComplianceCategory)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => school_service_1.SchoolService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_service_1.UserService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        school_service_1.SchoolService,
        user_service_1.UserService])
], ComplianceCategoryService);
//# sourceMappingURL=compliance-category.service.js.map
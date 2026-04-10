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
exports.ComplianceCategoryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const categoryInclude = {
    school: { select: { id: true, name: true } },
    createdBy: { select: { id: true, name: true, email: true } },
    _count: { select: { documentTypes: true } },
};
let ComplianceCategoryService = class ComplianceCategoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, user) {
        if (user.role !== client_1.UserRole.ADMIN && user.role !== client_1.UserRole.DIRECTOR) {
            throw new common_1.ForbiddenException('Only admins and directors can create compliance categories');
        }
        let schoolId;
        if (user.role === client_1.UserRole.ADMIN) {
            if (!dto.schoolId) {
                throw new common_1.BadRequestException('schoolId is required when creating as admin');
            }
            const school = await this.prisma.school.findUnique({
                where: { id: dto.schoolId },
            });
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
        const existing = await this.prisma.complianceCategory.findUnique({
            where: { schoolId_slug: { schoolId, slug } },
        });
        if (existing) {
            throw new common_1.BadRequestException(`A category with slug "${slug}" already exists for this school`);
        }
        return this.prisma.complianceCategory.create({
            data: {
                name: dto.name.trim(),
                slug,
                description: dto.description?.trim() || null,
                icon: dto.icon || null,
                sortOrder: dto.sortOrder ?? 0,
                schoolId,
                createdById: user.id,
            },
            include: categoryInclude,
        });
    }
    async update(id, dto, user) {
        const category = await this.prisma.complianceCategory.findUnique({
            where: { id },
        });
        if (!category)
            throw new common_1.NotFoundException('Compliance category not found');
        this.assertAccess(user, category.schoolId);
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name.trim();
        if (dto.description !== undefined)
            data.description = dto.description?.trim() || null;
        if (dto.icon !== undefined)
            data.icon = dto.icon || null;
        if (dto.sortOrder !== undefined)
            data.sortOrder = dto.sortOrder;
        if (Object.keys(data).length === 0) {
            return this.prisma.complianceCategory.findUniqueOrThrow({
                where: { id },
                include: categoryInclude,
            });
        }
        return this.prisma.complianceCategory.update({
            where: { id },
            data,
            include: categoryInclude,
        });
    }
    async delete(id, user) {
        const category = await this.prisma.complianceCategory.findUnique({
            where: { id },
            include: { _count: { select: { documentTypes: true } } },
        });
        if (!category)
            throw new common_1.NotFoundException('Compliance category not found');
        this.assertAccess(user, category.schoolId);
        if (category._count.documentTypes > 0) {
            throw new common_1.BadRequestException('Cannot delete a category that has document types linked to it. Unlink the document types first.');
        }
        await this.prisma.complianceCategory.delete({ where: { id } });
        return { deleted: true };
    }
    async findAll(user, schoolId) {
        const where = {};
        if (user.role === client_1.UserRole.ADMIN) {
            if (schoolId)
                where.schoolId = schoolId;
        }
        else {
            if (!user.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a school');
            }
            where.schoolId = user.schoolId;
        }
        return this.prisma.complianceCategory.findMany({
            where,
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            include: categoryInclude,
        });
    }
    async findOne(id, user) {
        const category = await this.prisma.complianceCategory.findUnique({
            where: { id },
            include: categoryInclude,
        });
        if (!category)
            throw new common_1.NotFoundException('Compliance category not found');
        this.assertAccess(user, category.schoolId);
        return category;
    }
    async findBySlug(slug, user) {
        if (!user.schoolId && user.role !== client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Your account is not linked to a school');
        }
        const schoolId = user.schoolId;
        if (!schoolId) {
            throw new common_1.BadRequestException('schoolId is required for slug-based lookup');
        }
        const category = await this.prisma.complianceCategory.findUnique({
            where: { schoolId_slug: { schoolId, slug } },
            include: categoryInclude,
        });
        if (!category)
            throw new common_1.NotFoundException('Compliance category not found');
        return category;
    }
    async getScore(id, user) {
        const category = await this.prisma.complianceCategory.findUnique({
            where: { id },
            include: {
                documentTypes: {
                    include: {
                        requiredUsers: {
                            select: { id: true, role: true },
                        },
                        documents: {
                            select: {
                                id: true,
                                ownerUserId: true,
                                expiresAt: true,
                                verifiedAt: true,
                            },
                        },
                    },
                },
            },
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
        for (const docType of category.documentTypes) {
            for (const requiredUser of docType.requiredUsers) {
                totalSlots++;
                const role = requiredUser.role;
                if (!byRole[role])
                    byRole[role] = { total: 0, satisfied: 0 };
                byRole[role].total++;
                const userDocs = docType.documents.filter((d) => d.ownerUserId === requiredUser.id);
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
        if (user.role === client_1.UserRole.ADMIN)
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
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], ComplianceCategoryService);
//# sourceMappingURL=compliance-category.service.js.map
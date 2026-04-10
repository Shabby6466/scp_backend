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
exports.SchoolService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const school_scope_util_js_1 = require("../auth/school-scope.util.js");
let SchoolService = class SchoolService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        return this.prisma.$transaction(async (tx) => {
            const school = await tx.school.create({
                data: { name: dto.name.trim() },
            });
            const directorId = dto.directorUserId?.trim();
            if (directorId) {
                const director = await tx.user.findUnique({
                    where: { id: directorId },
                });
                if (!director) {
                    throw new common_1.NotFoundException('Director user not found');
                }
                if (director.role === client_1.UserRole.ADMIN) {
                    throw new common_1.BadRequestException('A platform admin cannot be assigned as a school director');
                }
                if (director.role !== client_1.UserRole.DIRECTOR) {
                    throw new common_1.BadRequestException('Selected user must have the director role');
                }
                await tx.user.update({
                    where: { id: director.id },
                    data: {
                        schoolId: school.id,
                        branchId: null,
                        staffPosition: null,
                        staffClearanceActive: false,
                    },
                });
            }
            return tx.school.findUniqueOrThrow({
                where: { id: school.id },
                include: {
                    _count: { select: { users: true, branches: true } },
                },
            });
        });
    }
    async findAll(user) {
        if (user.role === client_1.UserRole.DIRECTOR && !user.schoolId) {
            return [];
        }
        if (user.role === client_1.UserRole.BRANCH_DIRECTOR && user.schoolId) {
            return this.prisma.school.findMany({
                where: { id: user.schoolId },
                orderBy: { name: 'asc' },
                include: {
                    _count: { select: { users: true, branches: true } },
                },
            });
        }
        const where = (0, school_scope_util_js_1.isSchoolDirector)(user) ? { id: user.schoolId } : {};
        return this.prisma.school.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { users: true, branches: true } },
            },
        });
    }
    async findOne(id, user) {
        if (user.role === client_1.UserRole.DIRECTOR) {
            if (!user.schoolId || user.schoolId !== id) {
                throw new common_1.ForbiddenException('Cannot access this school');
            }
        }
        if (user.role === client_1.UserRole.BRANCH_DIRECTOR) {
            if (!user.schoolId || user.schoolId !== id) {
                throw new common_1.ForbiddenException('Cannot access this school');
            }
        }
        const school = await this.prisma.school.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        createdAt: true,
                    },
                },
                _count: { select: { users: true, branches: true } },
            },
        });
        if (!school) {
            throw new common_1.NotFoundException('School not found');
        }
        return school;
    }
    async update(id, dto, user) {
        if (user?.role === client_1.UserRole.DIRECTOR) {
            if (!user.schoolId || user.schoolId !== id) {
                throw new common_1.ForbiddenException('Cannot update this school');
            }
        }
        await this.findOne(id, user ?? { role: client_1.UserRole.ADMIN, schoolId: null });
        return this.prisma.school.update({
            where: { id },
            data: dto.name != null ? { name: dto.name.trim() } : {},
        });
    }
    async remove(id) {
        await this.findOne(id, { role: client_1.UserRole.ADMIN, schoolId: null });
        return this.prisma.school.delete({
            where: { id },
        });
    }
};
exports.SchoolService = SchoolService;
exports.SchoolService = SchoolService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], SchoolService);
//# sourceMappingURL=school.service.js.map
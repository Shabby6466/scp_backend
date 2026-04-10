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
exports.BranchService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const school_scope_util_js_1 = require("../auth/school-scope.util.js");
const branchDetailInclude = {
    school: true,
    users: {
        where: { role: client_1.UserRole.BRANCH_DIRECTOR },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
        },
    },
};
let BranchService = class BranchService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(schoolId, dto, user) {
        if (!(0, school_scope_util_js_1.canManageSchoolBranches)(user, schoolId)) {
            throw new common_1.ForbiddenException('Cannot create branches for this school');
        }
        return this.prisma.$transaction(async (tx) => {
            const branch = await tx.branch.create({
                data: {
                    name: dto.name.trim(),
                    schoolId,
                },
            });
            await this.syncBranchDirectorForBranch(tx, branch, dto.branchDirectorUserId);
            return branch;
        });
    }
    async findAllBySchool(schoolId, user) {
        if (user.role === client_1.UserRole.BRANCH_DIRECTOR) {
            if (!user.branchId || user.schoolId !== schoolId) {
                throw new common_1.ForbiddenException('Cannot access branches for this school');
            }
            const b = await this.prisma.branch.findFirst({
                where: { id: user.branchId, schoolId },
            });
            if (!b) {
                throw new common_1.ForbiddenException('Cannot access branches for this school');
            }
            return [b];
        }
        if (!(0, school_scope_util_js_1.canManageSchoolBranches)(user, schoolId)) {
            throw new common_1.ForbiddenException('Cannot access this school');
        }
        return this.prisma.branch.findMany({
            where: { schoolId },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id, user) {
        const branch = await this.prisma.branch.findUnique({
            where: { id },
            include: branchDetailInclude,
        });
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found');
        }
        await this.ensureCanAccessBranchRecord(branch, user);
        return branch;
    }
    async listTeachers(id, user) {
        const branch = await this.prisma.branch.findUnique({ where: { id } });
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found');
        }
        await this.ensureCanAccessBranchRecord(branch, user);
        return this.prisma.user.findMany({
            where: {
                role: client_1.UserRole.TEACHER,
                branchId: id,
            },
            orderBy: [{ email: 'asc' }],
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                schoolId: true,
                branchId: true,
                createdAt: true,
                staffPosition: true,
                staffClearanceActive: true,
                branch: { select: { id: true, name: true, schoolId: true } },
            },
        });
    }
    async update(id, dto, user) {
        const branch = await this.prisma.branch.findUnique({ where: { id } });
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found');
        }
        const schoolLevel = (0, school_scope_util_js_1.canManageSchoolBranches)(user, branch.schoolId);
        const branchLevel = (0, school_scope_util_js_1.canManageBranchLikeDirector)(user, branch);
        if (!schoolLevel && !branchLevel) {
            throw new common_1.ForbiddenException('Cannot update this branch');
        }
        if (dto.branchDirectorUserId !== undefined && !schoolLevel) {
            throw new common_1.ForbiddenException('Only a school director, school admin, or platform admin can assign or remove a branch director');
        }
        if (dto.name === undefined && dto.branchDirectorUserId === undefined) {
            throw new common_1.BadRequestException('Provide at least one field to update');
        }
        return this.prisma.$transaction(async (tx) => {
            await this.syncBranchDirectorForBranch(tx, branch, dto.branchDirectorUserId);
            const data = {};
            if (dto.name != null) {
                data.name = dto.name.trim();
            }
            if (Object.keys(data).length > 0) {
                await tx.branch.update({ where: { id }, data });
            }
            return tx.branch.findUniqueOrThrow({
                where: { id },
                include: branchDetailInclude,
            });
        });
    }
    async remove(id, user) {
        const branch = await this.prisma.branch.findUnique({ where: { id } });
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found');
        }
        if (!(0, school_scope_util_js_1.canManageSchoolBranches)(user, branch.schoolId)) {
            throw new common_1.ForbiddenException('Cannot delete this branch');
        }
        return this.prisma.branch.delete({
            where: { id },
        });
    }
    async syncBranchDirectorForBranch(tx, branch, incoming) {
        if (incoming === undefined) {
            return;
        }
        const trimmed = incoming.trim();
        if (!trimmed) {
            await tx.user.updateMany({
                where: {
                    branchId: branch.id,
                    role: client_1.UserRole.BRANCH_DIRECTOR,
                },
                data: {
                    branchId: null,
                    schoolId: branch.schoolId,
                },
            });
            return;
        }
        const directorUser = await tx.user.findUnique({
            where: { id: trimmed },
        });
        if (!directorUser) {
            throw new common_1.NotFoundException('Branch director user not found');
        }
        if (directorUser.role === client_1.UserRole.ADMIN) {
            throw new common_1.BadRequestException('A platform admin cannot be assigned as a branch director');
        }
        if (directorUser.role !== client_1.UserRole.BRANCH_DIRECTOR) {
            throw new common_1.BadRequestException('Selected user must have the branch director role');
        }
        if (directorUser.branchId != null && directorUser.branchId !== branch.id) {
            throw new common_1.BadRequestException('Selected user is already assigned to another branch; choose someone in the pool or reassign them first');
        }
        if (directorUser.schoolId != null &&
            directorUser.schoolId !== branch.schoolId) {
            throw new common_1.BadRequestException('Branch director belongs to a different school');
        }
        await tx.user.updateMany({
            where: {
                branchId: branch.id,
                role: client_1.UserRole.BRANCH_DIRECTOR,
                NOT: { id: trimmed },
            },
            data: {
                branchId: null,
                schoolId: branch.schoolId,
            },
        });
        await tx.user.update({
            where: { id: trimmed },
            data: {
                branchId: branch.id,
                schoolId: branch.schoolId,
                staffPosition: null,
                staffClearanceActive: false,
            },
        });
    }
    async ensureCanAccessBranchRecord(branch, user) {
        if (user.role === client_1.UserRole.ADMIN)
            return;
        if (user.role === client_1.UserRole.DIRECTOR &&
            user.schoolId === branch.schoolId)
            return;
        if ((0, school_scope_util_js_1.directorOwnsBranchSchool)(user, branch.schoolId))
            return;
        if ((0, school_scope_util_js_1.canManageBranchLikeDirector)(user, branch))
            return;
        if (user.role === client_1.UserRole.TEACHER && user.branchId === branch.id)
            return;
        if (user.role === client_1.UserRole.STUDENT && user.branchId === branch.id) {
            return;
        }
        throw new common_1.ForbiddenException('Cannot access this branch');
    }
};
exports.BranchService = BranchService;
exports.BranchService = BranchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], BranchService);
//# sourceMappingURL=branch.service.js.map
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
exports.BranchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const branch_entity_1 = require("../../entities/branch.entity");
const user_entity_1 = require("../../entities/user.entity");
const database_enum_1 = require("../common/enums/database.enum");
const school_scope_util_1 = require("../auth/school-scope.util");
const user_service_1 = require("../user/user.service");
let BranchService = class BranchService {
    constructor(branchRepository, userService, dataSource) {
        this.branchRepository = branchRepository;
        this.userService = userService;
        this.dataSource = dataSource;
    }
    async findBySchoolId(schoolId) {
        return this.branchRepository.find({
            where: { schoolId },
            select: { id: true, name: true, schoolId: true },
        });
    }
    async findOneById(id) {
        return this.branchRepository.findOne({ where: { id } });
    }
    async create(schoolId, dto, user) {
        if (!(0, school_scope_util_1.canManageSchoolBranches)(user, schoolId)) {
            throw new common_1.ForbiddenException('Cannot create branches for this school');
        }
        return this.dataSource.transaction(async (manager) => {
            let branch = manager.create(branch_entity_1.Branch, {
                name: dto.name.trim(),
                schoolId,
            });
            branch = await manager.save(branch_entity_1.Branch, branch);
            await this.syncBranchDirectorForBranch(manager, branch, dto.branchDirectorUserId);
            return branch;
        });
    }
    async findAllBySchool(schoolId, user) {
        if (user.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
            if (!user.branchId || user.schoolId !== schoolId) {
                throw new common_1.ForbiddenException('Cannot access branches for this school');
            }
            const b = await this.branchRepository.findOne({
                where: { id: user.branchId, schoolId },
            });
            if (!b) {
                throw new common_1.ForbiddenException('Cannot access branches for this school');
            }
            return [b];
        }
        if (!(0, school_scope_util_1.canManageSchoolBranches)(user, schoolId)) {
            throw new common_1.ForbiddenException('Cannot access this school');
        }
        return this.branchRepository.find({
            where: { schoolId },
            order: { name: 'ASC' },
        });
    }
    async findOne(id, user) {
        const branch = await this.branchRepository.findOne({
            where: { id },
            relations: ['school', 'users'],
        });
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found');
        }
        await this.ensureCanAccessBranchRecord(branch, user);
        if (branch.users) {
            branch.users = branch.users.filter(u => u.role === database_enum_1.UserRole.BRANCH_DIRECTOR);
        }
        return branch;
    }
    async listTeachers(id, user) {
        const branch = await this.branchRepository.findOne({ where: { id } });
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found');
        }
        await this.ensureCanAccessBranchRecord(branch, user);
        return this.userService.findTeachersByBranchId(id);
    }
    async update(id, dto, user) {
        const branch = await this.branchRepository.findOne({ where: { id } });
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found');
        }
        const schoolLevel = (0, school_scope_util_1.canManageSchoolBranches)(user, branch.schoolId);
        const branchLevel = (0, school_scope_util_1.canManageBranchLikeDirector)(user, branch);
        if (!schoolLevel && !branchLevel) {
            throw new common_1.ForbiddenException('Cannot update this branch');
        }
        if (dto.branchDirectorUserId !== undefined && !schoolLevel) {
            throw new common_1.ForbiddenException('Only a school director, school admin, or platform admin can assign or remove a branch director');
        }
        if (dto.name === undefined && dto.branchDirectorUserId === undefined) {
            throw new common_1.BadRequestException('Provide at least one field to update');
        }
        return this.dataSource.transaction(async (manager) => {
            await this.syncBranchDirectorForBranch(manager, branch, dto.branchDirectorUserId);
            if (dto.name != null) {
                branch.name = dto.name.trim();
                await manager.save(branch_entity_1.Branch, branch);
            }
            const result = await manager.findOne(branch_entity_1.Branch, {
                where: { id },
                relations: ['school', 'users'],
            });
            if (result?.users) {
                result.users = result.users.filter(u => u.role === database_enum_1.UserRole.BRANCH_DIRECTOR);
            }
            return result;
        });
    }
    async remove(id, user) {
        const branch = await this.branchRepository.findOne({ where: { id } });
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found');
        }
        if (!(0, school_scope_util_1.canManageSchoolBranches)(user, branch.schoolId)) {
            throw new common_1.ForbiddenException('Cannot delete this branch');
        }
        return this.branchRepository.remove(branch);
    }
    async syncBranchDirectorForBranch(manager, branch, incoming) {
        if (incoming === undefined) {
            return;
        }
        const trimmed = incoming.trim();
        if (!trimmed) {
            const bds = await manager.find(user_entity_1.User, {
                where: {
                    branchId: branch.id,
                    role: database_enum_1.UserRole.BRANCH_DIRECTOR,
                },
            });
            for (const bd of bds) {
                bd.branchId = null;
                bd.schoolId = branch.schoolId;
            }
            await manager.save(user_entity_1.User, bds);
            return;
        }
        const directorUser = await manager.findOne(user_entity_1.User, {
            where: { id: trimmed },
        });
        if (!directorUser) {
            throw new common_1.NotFoundException('Branch director user not found');
        }
        if (directorUser.role === database_enum_1.UserRole.ADMIN) {
            throw new common_1.BadRequestException('A platform admin cannot be assigned as a branch director');
        }
        if (directorUser.role !== database_enum_1.UserRole.BRANCH_DIRECTOR) {
            throw new common_1.BadRequestException('Selected user must have the branch director role');
        }
        if (directorUser.branchId != null && directorUser.branchId !== branch.id) {
            throw new common_1.BadRequestException('Selected user is already assigned to another branch; choose someone in the pool or reassign them first');
        }
        if (directorUser.schoolId != null &&
            directorUser.schoolId !== branch.schoolId) {
            throw new common_1.BadRequestException('Branch director belongs to a different school');
        }
        const others = await manager.find(user_entity_1.User, {
            where: {
                branchId: branch.id,
                role: database_enum_1.UserRole.BRANCH_DIRECTOR,
            },
        });
        for (const other of others) {
            if (other.id !== trimmed) {
                other.branchId = null;
                other.schoolId = branch.schoolId;
            }
        }
        await manager.save(user_entity_1.User, others);
        directorUser.branchId = branch.id;
        directorUser.schoolId = branch.schoolId;
        directorUser.staffPosition = null;
        directorUser.staffClearanceActive = false;
        await manager.save(user_entity_1.User, directorUser);
    }
    async ensureCanAccessBranchRecord(branch, user) {
        if (user.role === database_enum_1.UserRole.ADMIN)
            return;
        if (user.role === database_enum_1.UserRole.DIRECTOR &&
            user.schoolId === branch.schoolId)
            return;
        if ((0, school_scope_util_1.directorOwnsBranchSchool)(user, branch.schoolId))
            return;
        if ((0, school_scope_util_1.canManageBranchLikeDirector)(user, branch))
            return;
        if (user.role === database_enum_1.UserRole.TEACHER && user.branchId === branch.id)
            return;
        if (user.role === database_enum_1.UserRole.STUDENT && user.branchId === branch.id) {
            return;
        }
        throw new common_1.ForbiddenException('Cannot access this branch');
    }
};
exports.BranchService = BranchService;
exports.BranchService = BranchService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(branch_entity_1.Branch)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_service_1.UserService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        user_service_1.UserService,
        typeorm_2.DataSource])
], BranchService);
//# sourceMappingURL=branch.service.js.map
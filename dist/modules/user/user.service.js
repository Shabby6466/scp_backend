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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("../../entities/user.entity");
const auth_service_1 = require("../auth/auth.service");
const settings_service_1 = require("../settings/settings.service");
const database_enum_1 = require("../common/enums/database.enum");
const school_scope_util_1 = require("../auth/school-scope.util");
const school_service_1 = require("../school/school.service");
const branch_service_1 = require("../branch/branch.service");
let UserService = class UserService {
    constructor(userRepository, schoolService, branchService, auth, settings) {
        this.userRepository = userRepository;
        this.schoolService = schoolService;
        this.branchService = branchService;
        this.auth = auth;
        this.settings = settings;
    }
    async createUser(dto, currentUser) {
        this.validateCreatePermission(dto, currentUser);
        const email = dto.email.toLowerCase().trim();
        const existing = await this.userRepository.findOne({
            where: { email },
        });
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
        }
        const { schoolId, branchId } = await this.resolveScopeForCreate(dto, currentUser);
        if (currentUser.role !== database_enum_1.UserRole.ADMIN &&
            dto.role !== database_enum_1.UserRole.ADMIN &&
            !schoolId &&
            !branchId) {
            throw new common_1.ForbiddenException('School or branch is required');
        }
        if (dto.role === database_enum_1.UserRole.DIRECTOR) {
            if (currentUser.role !== database_enum_1.UserRole.ADMIN) {
                throw new common_1.ForbiddenException('Only a platform admin can assign a school director');
            }
            if (schoolId) {
                const taken = await this.userRepository.findOne({
                    where: { role: database_enum_1.UserRole.DIRECTOR, schoolId },
                });
                if (taken) {
                    throw new common_1.ConflictException('This school already has a director');
                }
            }
        }
        if (dto.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
            if (currentUser.role !== database_enum_1.UserRole.ADMIN &&
                !(0, school_scope_util_1.isSchoolDirector)(currentUser)) {
                throw new common_1.ForbiddenException('Only a platform admin or school director can assign a branch director');
            }
            if (branchId && schoolId) {
                await this.assertBranchInSchool(branchId, schoolId);
            }
            if (!branchId && !schoolId && currentUser.role !== database_enum_1.UserRole.ADMIN) {
                throw new common_1.BadRequestException('schoolId is required for a pool branch director (no branch yet)');
            }
            if ((0, school_scope_util_1.isSchoolDirector)(currentUser) &&
                schoolId &&
                currentUser.schoolId &&
                schoolId !== currentUser.schoolId) {
                throw new common_1.ForbiddenException('Branch director must belong to your school');
            }
        }
        if (((0, school_scope_util_1.isSchoolDirector)(currentUser) ||
            currentUser.role === database_enum_1.UserRole.DIRECTOR) &&
            branchId &&
            (dto.role === database_enum_1.UserRole.TEACHER || dto.role === database_enum_1.UserRole.STUDENT)) {
            await this.assertBranchInSchool(branchId, currentUser.schoolId);
        }
        if (currentUser.role === database_enum_1.UserRole.BRANCH_DIRECTOR &&
            dto.role === database_enum_1.UserRole.TEACHER) {
            if (!branchId || branchId !== currentUser.branchId) {
                throw new common_1.ForbiddenException('Teachers must be created for your branch only');
            }
        }
        if (currentUser.role === database_enum_1.UserRole.BRANCH_DIRECTOR &&
            dto.role === database_enum_1.UserRole.STUDENT) {
            if (!branchId || branchId !== currentUser.branchId) {
                throw new common_1.ForbiddenException('Students must be created for your branch only');
            }
        }
        let resolvedSchoolId = schoolId;
        let resolvedBranchId = branchId;
        if ((dto.role === database_enum_1.UserRole.TEACHER || dto.role === database_enum_1.UserRole.STUDENT) &&
            branchId) {
            const b = await this.branchService.findOneById(branchId);
            if (!b) {
                throw new common_1.NotFoundException('Branch not found');
            }
            resolvedSchoolId = b.schoolId;
            resolvedBranchId = branchId;
        }
        const { otpEmailVerificationEnabled } = await this.settings.getPublic();
        const skipInviteEmail = dto.role !== database_enum_1.UserRole.ADMIN && !otpEmailVerificationEnabled;
        const user = this.userRepository.create({
            email,
            name: dto.name.trim(),
            role: dto.role,
            schoolId: dto.role === database_enum_1.UserRole.DIRECTOR ||
                dto.role === database_enum_1.UserRole.BRANCH_DIRECTOR
                ? (schoolId ?? null)
                : dto.role === database_enum_1.UserRole.TEACHER || dto.role === database_enum_1.UserRole.STUDENT
                    ? resolvedSchoolId
                    : null,
            branchId: dto.role === database_enum_1.UserRole.TEACHER ||
                dto.role === database_enum_1.UserRole.STUDENT ||
                dto.role === database_enum_1.UserRole.BRANCH_DIRECTOR
                ? resolvedBranchId
                : null,
            staffPosition: null,
            staffClearanceActive: false,
            ...(skipInviteEmail ? { emailVerifiedAt: new Date() } : {}),
        });
        await this.userRepository.save(user);
        const result = await this.userRepository.findOne({
            where: { id: user.id },
            relations: ['school', 'branch'],
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                schoolId: true,
                branchId: true,
                createdAt: true,
                school: { id: true, name: true },
                branch: { id: true, name: true },
            },
        });
        if (dto.role !== database_enum_1.UserRole.ADMIN && otpEmailVerificationEnabled) {
            await this.auth.sendInviteOtp(email, currentUser.name ?? undefined);
        }
        return result;
    }
    async getBranchForUser(branchId) {
        const branch = await this.branchService.findOneById(branchId);
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found');
        }
        return branch;
    }
    async listTeachersForSchoolDirector(currentUser) {
        if ((0, school_scope_util_1.isSchoolDirector)(currentUser)) {
            return this.userRepository.find({
                where: {
                    role: database_enum_1.UserRole.TEACHER,
                    branch: { schoolId: currentUser.schoolId },
                },
                order: { email: 'ASC' },
                relations: ['branch'],
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
                    branch: { id: true, name: true, schoolId: true },
                },
            });
        }
        if (currentUser.role === database_enum_1.UserRole.BRANCH_DIRECTOR && currentUser.branchId) {
            return this.userRepository.find({
                where: {
                    role: database_enum_1.UserRole.TEACHER,
                    branchId: currentUser.branchId,
                },
                order: { email: 'ASC' },
                relations: ['branch'],
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
                    branch: { id: true, name: true, schoolId: true },
                },
            });
        }
        if (currentUser.role === database_enum_1.UserRole.STUDENT &&
            currentUser.branchId &&
            currentUser.schoolId) {
            return this.userRepository.find({
                where: {
                    role: database_enum_1.UserRole.TEACHER,
                    branchId: currentUser.branchId,
                    schoolId: currentUser.schoolId,
                },
                order: { email: 'ASC' },
                relations: ['branch'],
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
                    branch: { id: true, name: true, schoolId: true },
                },
            });
        }
        throw new common_1.ForbiddenException('Only a school director, branch director, or student (own branch) can list teachers this way');
    }
    async findStudentsWithRequiredDocs(branchId) {
        return this.userRepository.find({
            where: { branchId, role: database_enum_1.UserRole.STUDENT },
            relations: ['requiredDocTypes', 'studentProfile'],
        });
    }
    async findTeachersWithRequiredDocs(branchId) {
        return this.userRepository.find({
            where: { role: database_enum_1.UserRole.TEACHER, branchId },
            relations: ['requiredDocTypes'],
        });
    }
    async countParentsInSchool(schoolId) {
        return this.userRepository.count({
            where: {
                schoolId,
                role: database_enum_1.UserRole.PARENT,
            },
        });
    }
    async listBranchDirectorCandidates(schoolId, currentUser) {
        if (!(0, school_scope_util_1.canManageSchoolBranches)(currentUser, schoolId)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const school = await this.schoolService.findOneInternal(schoolId);
        if (!school) {
            throw new common_1.NotFoundException('School not found');
        }
        return this.userRepository.find({
            where: [
                { role: database_enum_1.UserRole.BRANCH_DIRECTOR, schoolId },
                { role: database_enum_1.UserRole.BRANCH_DIRECTOR, branch: { schoolId } },
                { role: database_enum_1.UserRole.BRANCH_DIRECTOR, schoolId: (0, typeorm_2.IsNull)(), branchId: (0, typeorm_2.IsNull)() },
            ],
            order: { email: 'ASC' },
            relations: ['branch', 'school'],
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                schoolId: true,
                branchId: true,
                createdAt: true,
                branch: { id: true, name: true, schoolId: true },
                school: { id: true, name: true },
            },
        });
    }
    async listBySchool(schoolId, currentUser, dto = {}) {
        if (currentUser.role === database_enum_1.UserRole.ADMIN) {
        }
        else if (currentUser.role === database_enum_1.UserRole.DIRECTOR) {
            if (currentUser.schoolId !== schoolId) {
                throw new common_1.ForbiddenException('Cannot access this school');
            }
        }
        else if (currentUser.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
            if (currentUser.schoolId !== schoolId || !currentUser.branchId) {
                throw new common_1.ForbiddenException('Cannot access this school');
            }
        }
        else if (currentUser.branchId) {
            const branch = await this.branchService.findOneById(currentUser.branchId);
            if (!branch || branch.schoolId !== schoolId) {
                throw new common_1.ForbiddenException('Cannot access this school');
            }
        }
        else {
            throw new common_1.ForbiddenException('Cannot access this school');
        }
        const school = await this.schoolService.findOneInternal(schoolId);
        if (!school) {
            throw new common_1.NotFoundException('School not found');
        }
        const where = {
            schoolId,
        };
        if (currentUser.role === database_enum_1.UserRole.BRANCH_DIRECTOR && currentUser.branchId) {
            where.branchId = currentUser.branchId;
        }
        Object.assign(where, this.searchDtoFilter(dto));
        return this.paginate(this.userRepository, {
            where,
            order: { role: 'DESC', email: 'ASC' },
            relations: ['branch'],
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
                branch: { id: true, name: true, schoolId: true },
            },
        }, dto);
    }
    searchDtoFilter(dto) {
        const filter = {};
        if (dto.query?.trim()) {
        }
        if (dto.role) {
            filter.role = dto.role;
        }
        if (dto.schoolId) {
            filter.schoolId = dto.schoolId;
        }
        if (dto.branchId) {
            filter.branchId = dto.branchId;
        }
        if (dto.staffPosition) {
            filter.staffPosition = dto.staffPosition;
        }
        if (dto.staffClearanceActive !== undefined) {
            filter.staffClearanceActive = dto.staffClearanceActive;
        }
        return filter;
    }
    async listAll(dto = {}) {
        const where = this.searchDtoFilter(dto);
        return this.paginate(this.userRepository, {
            where,
            order: { role: 'DESC', email: 'ASC' },
            relations: ['school', 'branch'],
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
                school: { id: true, name: true },
                branch: { id: true, name: true, schoolId: true },
            },
        }, dto);
    }
    async listUsersForCaller(dto, user) {
        if (user.role === database_enum_1.UserRole.ADMIN) {
            return this.listAll(dto);
        }
        if (user.role !== database_enum_1.UserRole.DIRECTOR && user.role !== database_enum_1.UserRole.BRANCH_DIRECTOR) {
            throw new common_1.ForbiddenException('Insufficient permissions to list users');
        }
        if (!user.schoolId) {
            throw new common_1.ForbiddenException('Account has no school scope');
        }
        if (dto.schoolId && dto.schoolId !== user.schoolId) {
            throw new common_1.ForbiddenException('Cannot list users for another school');
        }
        return this.listBySchool(user.schoolId, user, dto);
    }
    async searchUsers(dto, currentUser) {
        const where = this.searchDtoFilter(dto);
        if (currentUser.role !== database_enum_1.UserRole.ADMIN) {
            if ((0, school_scope_util_1.isSchoolDirector)(currentUser)) {
                where.schoolId = currentUser.schoolId;
            }
            else if (currentUser.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
                where.branchId = currentUser.branchId;
            }
            else {
                where.id = currentUser.id;
            }
        }
        return this.paginate(this.userRepository, {
            where,
            order: { role: 'DESC', name: 'ASC' },
            relations: ['school', 'branch'],
        }, dto);
    }
    async paginate(repository, options, params) {
        const page = Math.max(1, params.page || 1);
        const limit = Math.max(1, Math.min(100, params.limit || 20));
        const skip = (page - 1) * limit;
        const [data, total] = await repository.findAndCount({
            ...options,
            take: limit,
            skip,
        });
        return {
            data,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }
    async findOneById(targetId, actor) {
        const user = await this.userRepository.findOne({
            where: { id: targetId },
            relations: ['branch', 'school'],
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                schoolId: true,
                branchId: true,
                phone: true,
                staffPosition: true,
                staffClearanceActive: true,
                createdAt: true,
                branch: { id: true, name: true, schoolId: true },
                school: { id: true, name: true },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (actor.role !== database_enum_1.UserRole.ADMIN && actor.id !== targetId) {
            const isSuperior = await this.isSuperiorOf(actor, {
                id: user.id,
                role: user.role,
                schoolId: user.schoolId,
                branchId: user.branchId,
            });
            if (!isSuperior) {
                throw new common_1.ForbiddenException('Cannot access this user');
            }
        }
        return user;
    }
    async getUserDetail(targetId, actor) {
        const user = await this.userRepository.findOne({
            where: { id: targetId },
            relations: [
                'school',
                'branch',
                'directorProfile',
                'branchDirectorProfile',
                'teacherProfile',
                'studentProfile',
                'parentProfile',
                'documents',
                'requiredDocTypes',
            ],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (actor.role !== database_enum_1.UserRole.ADMIN && actor.id !== targetId) {
            const isSuperior = await this.isSuperiorOf(actor, user);
            if (!isSuperior) {
                throw new common_1.ForbiddenException('Cannot access this user details');
            }
        }
        return user;
    }
    async isSuperiorOf(actor, target) {
        if (actor.role === database_enum_1.UserRole.ADMIN)
            return true;
        if ((0, school_scope_util_1.isSchoolDirector)(actor)) {
            if (!actor.schoolId)
                return false;
            return this.userBelongsToSchool(target.id, actor.schoolId);
        }
        if (actor.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
            if (!actor.branchId)
                return false;
            return this.userBelongsToBranchScope(target.id, actor.branchId);
        }
        return false;
    }
    async updateUser(targetId, dto, actor) {
        const adminScopePatch = actor.role === database_enum_1.UserRole.ADMIN &&
            (dto.schoolId !== undefined || dto.branchId !== undefined);
        if (dto.name === undefined &&
            (dto.password === undefined || dto.password === '') &&
            !adminScopePatch) {
            throw new common_1.BadRequestException('Provide name and/or a new password to update');
        }
        const target = await this.userRepository.findOne({
            where: { id: targetId },
        });
        if (!target) {
            throw new common_1.NotFoundException('User not found');
        }
        if (target.role === database_enum_1.UserRole.ADMIN && adminScopePatch) {
            throw new common_1.BadRequestException('Cannot assign school or branch to a platform admin');
        }
        if (actor.id === target.id) {
            if (actor.role !== database_enum_1.UserRole.ADMIN) {
                throw new common_1.ForbiddenException('You cannot change your own account. Ask a supervisor.');
            }
        }
        else {
            await this.assertSuperiorCanPatchUser(actor, target);
        }
        const data = {};
        if (dto.name !== undefined) {
            data.name = dto.name.trim();
        }
        if (dto.password !== undefined && dto.password.length > 0) {
            data.password = await bcrypt.hash(dto.password, 12);
        }
        if (actor.role === database_enum_1.UserRole.ADMIN && dto.schoolId !== undefined) {
            const sid = dto.schoolId.trim();
            if (target.role === database_enum_1.UserRole.DIRECTOR) {
                if (sid) {
                    const taken = await this.userRepository.findOne({
                        where: {
                            role: database_enum_1.UserRole.DIRECTOR,
                            schoolId: sid,
                            id: (0, typeorm_2.Not)(target.id),
                        },
                    });
                    if (taken) {
                        throw new common_1.ConflictException('This school already has a director');
                    }
                }
                data.schoolId = sid || null;
                data.branchId = null;
            }
            else if (target.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
                data.schoolId = sid || null;
                if (!sid) {
                    data.branchId = null;
                }
            }
        }
        if (actor.role === database_enum_1.UserRole.ADMIN && dto.branchId !== undefined) {
            const bid = dto.branchId.trim();
            if (target.role === database_enum_1.UserRole.TEACHER) {
                if (bid) {
                    const b = await this.branchService.findOneById(bid);
                    if (!b) {
                        throw new common_1.NotFoundException('Branch not found');
                    }
                    data.branchId = bid;
                }
                else {
                    data.branchId = null;
                }
            }
            else if (target.role === database_enum_1.UserRole.BRANCH_DIRECTOR && bid) {
                const b = await this.branchService.findOneById(bid);
                if (!b) {
                    throw new common_1.NotFoundException('Branch not found');
                }
                data.branchId = bid;
                data.schoolId = b.schoolId;
            }
        }
        await this.userRepository.update(targetId, data);
        return this.userRepository.findOne({
            where: { id: targetId },
            relations: ['school', 'branch'],
        });
    }
    async assertBranchInSchool(branchId, schoolId) {
        const branch = await this.branchService.findOneById(branchId);
        if (!branch || branch.schoolId !== schoolId) {
            throw new common_1.ForbiddenException('Branch is not in your school');
        }
    }
    async assertSuperiorCanPatchUser(actor, target) {
        if (actor.role === database_enum_1.UserRole.ADMIN) {
            return;
        }
        if (target.role === database_enum_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only a platform admin can edit this account');
        }
        if (actor.role === database_enum_1.UserRole.DIRECTOR) {
            if (!actor.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a school');
            }
            if (target.role === database_enum_1.UserRole.DIRECTOR) {
                throw new common_1.ForbiddenException('Only a platform admin can edit the school director');
            }
            const ok = await this.userBelongsToSchool(target.id, actor.schoolId);
            if (!ok) {
                throw new common_1.ForbiddenException('User is not in your school');
            }
            return;
        }
        if (actor.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
            if (!actor.branchId || !actor.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a branch');
            }
            if (target.role === database_enum_1.UserRole.DIRECTOR ||
                target.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
                throw new common_1.ForbiddenException('You cannot edit this account');
            }
            const ok = await this.userBelongsToBranchScope(target.id, actor.branchId);
            if (!ok) {
                throw new common_1.ForbiddenException('User is not at your branch');
            }
            return;
        }
        throw new common_1.ForbiddenException('Insufficient permissions');
    }
    async userBelongsToSchool(userId, schoolId) {
        const u = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['branch'],
        });
        if (!u) {
            return false;
        }
        if (u.schoolId === schoolId) {
            return true;
        }
        if (u.branch?.schoolId === schoolId) {
            return true;
        }
        return false;
    }
    async userBelongsToBranchScope(userId, branchId) {
        const u = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!u)
            return false;
        if (u.role === database_enum_1.UserRole.TEACHER ||
            u.role === database_enum_1.UserRole.BRANCH_DIRECTOR ||
            u.role === database_enum_1.UserRole.STUDENT) {
            return u.branchId === branchId;
        }
        return false;
    }
    validateCreatePermission(dto, currentUser) {
        if (currentUser.role === database_enum_1.UserRole.ADMIN) {
            return;
        }
        if (currentUser.role === database_enum_1.UserRole.DIRECTOR) {
            if (!currentUser.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a school');
            }
            if (dto.role !== database_enum_1.UserRole.TEACHER &&
                dto.role !== database_enum_1.UserRole.STUDENT &&
                dto.role !== database_enum_1.UserRole.BRANCH_DIRECTOR) {
                throw new common_1.ForbiddenException('You can only create teachers, students, or branch directors');
            }
            return;
        }
        if (currentUser.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
            if (dto.role !== database_enum_1.UserRole.TEACHER && dto.role !== database_enum_1.UserRole.STUDENT) {
                throw new common_1.ForbiddenException('You can only create teachers or students for your branch');
            }
            return;
        }
        throw new common_1.ForbiddenException('Insufficient permissions');
    }
    async resolveScopeForCreate(dto, currentUser) {
        if (dto.role === database_enum_1.UserRole.ADMIN) {
            return { schoolId: null, branchId: null };
        }
        if (currentUser.role === database_enum_1.UserRole.ADMIN) {
            if (dto.role === database_enum_1.UserRole.DIRECTOR) {
                return { schoolId: dto.schoolId ?? null, branchId: null };
            }
            if (dto.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
                if (dto.branchId) {
                    const b = await this.branchService.findOneById(dto.branchId);
                    if (!b) {
                        throw new common_1.NotFoundException('Branch not found');
                    }
                    return { schoolId: b.schoolId, branchId: dto.branchId };
                }
                return { schoolId: dto.schoolId ?? null, branchId: null };
            }
            if (dto.role === database_enum_1.UserRole.TEACHER || dto.role === database_enum_1.UserRole.STUDENT) {
                return { schoolId: null, branchId: dto.branchId ?? null };
            }
            return { schoolId: null, branchId: null };
        }
        if (currentUser.role === database_enum_1.UserRole.DIRECTOR) {
            if (!currentUser.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a school');
            }
            if (dto.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
                if (dto.branchId) {
                    return { schoolId: currentUser.schoolId, branchId: dto.branchId };
                }
                return { schoolId: currentUser.schoolId, branchId: null };
            }
            return { schoolId: null, branchId: dto.branchId ?? null };
        }
        if (currentUser.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
            if (!currentUser.branchId || !currentUser.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a branch');
            }
            return { schoolId: currentUser.schoolId, branchId: currentUser.branchId };
        }
        throw new common_1.ForbiddenException('Insufficient permissions');
    }
    async findTeachersByBranchId(branchId) {
        return this.userRepository.find({
            where: {
                role: database_enum_1.UserRole.TEACHER,
                branchId,
            },
            order: { email: 'ASC' },
            relations: ['branch'],
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
                branch: { id: true, name: true, schoolId: true },
            },
        });
    }
    async findOneByEmailForAuth(email) {
        return this.userRepository.findOne({
            where: { email },
            relations: ['school', 'branch'],
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                schoolId: true,
                branchId: true,
                password: true,
                emailVerifiedAt: true,
                school: { id: true, name: true },
                branch: { id: true, name: true, schoolId: true },
            },
        });
    }
    async findOneByEmailInternal(email) {
        return this.userRepository.findOne({
            where: { email },
        });
    }
    async createSelfRegisteredUser(data) {
        const user = this.userRepository.create({
            email: data.email,
            name: data.name,
            password: data.passwordHash,
            role: data.role,
            emailVerifiedAt: data.verified ? new Date() : null,
        });
        return this.userRepository.save(user);
    }
    async markEmailVerified(userId, newPasswordHash) {
        const data = {
            emailVerifiedAt: new Date(),
        };
        if (newPasswordHash) {
            data.password = newPasswordHash;
        }
        await this.userRepository.update(userId, data);
    }
    async findOneByEmailWithRelations(email, relations) {
        return this.userRepository.findOne({
            where: { email },
            relations,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                schoolId: true,
                branchId: true,
                school: { id: true, name: true },
                branch: { id: true, name: true, schoolId: true },
            },
        });
    }
    async findDirectorBySchool(schoolId) {
        return this.userRepository.findOne({
            where: { role: database_enum_1.UserRole.DIRECTOR, schoolId },
            select: { id: true, name: true, email: true },
            order: { createdAt: 'ASC' },
        });
    }
    async findBranchDirectorByBranch(branchId) {
        return this.userRepository.findOne({
            where: { role: database_enum_1.UserRole.BRANCH_DIRECTOR, branchId },
            select: { id: true, name: true, email: true },
            order: { createdAt: 'ASC' },
        });
    }
    async findOneInternal(id) {
        return this.userRepository.findOne({ where: { id } });
    }
    async findUsersByIds(ids) {
        return this.userRepository.find({ where: { id: (0, typeorm_2.In)(ids) } });
    }
    async findRequiredDocTypesForUser(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['requiredDocTypes'],
        });
        return user?.requiredDocTypes || [];
    }
    async countByRoles(scope) {
        const qb = this.userRepository.createQueryBuilder('u')
            .select('u.role', 'role')
            .addSelect('COUNT(*)', 'count')
            .groupBy('u.role');
        if (scope.branchId) {
            qb.where('u.branchId = :branchId', { branchId: scope.branchId });
        }
        else if (scope.schoolId) {
            qb.innerJoin('u.branch', 'b').where('b.schoolId = :schoolId', { schoolId: scope.schoolId });
        }
        const stats = await qb.getRawMany();
        return stats.reduce((acc, s) => ({ ...acc, [s.role]: parseInt(s.count) }), {});
    }
    async findAtRiskStaff(scope, limit = 5) {
        const aqb = this.userRepository.createQueryBuilder('u')
            .where('u.role IN (:...roles)', { roles: [database_enum_1.UserRole.TEACHER, database_enum_1.UserRole.STUDENT] })
            .leftJoin('u.ownerDocuments', 'd', 'd.verifiedAt IS NOT NULL')
            .take(limit);
        if (scope.branchId) {
            aqb.andWhere('u.branchId = :branchId', { branchId: scope.branchId });
        }
        else if (scope.schoolId) {
            aqb.innerJoin('u.branch', 'b').andWhere('b.schoolId = :schoolId', { schoolId: scope.schoolId });
        }
        aqb.andWhere('d.id IS NULL');
        return aqb.getMany();
    }
    async remove(targetId, actorId) {
        const user = await this.userRepository.findOne({ where: { id: targetId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.deletedBy = actorId;
        await this.userRepository.save(user);
        return this.userRepository.softDelete(targetId);
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => school_service_1.SchoolService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => branch_service_1.BranchService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => auth_service_1.AuthService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        school_service_1.SchoolService,
        branch_service_1.BranchService,
        auth_service_1.AuthService,
        settings_service_1.SettingsService])
], UserService);
//# sourceMappingURL=user.service.js.map
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const auth_service_js_1 = require("../auth/auth.service.js");
const settings_service_js_1 = require("../settings/settings.service.js");
const school_scope_util_js_1 = require("../auth/school-scope.util.js");
let UserService = class UserService {
    prisma;
    auth;
    settings;
    constructor(prisma, auth, settings) {
        this.prisma = prisma;
        this.auth = auth;
        this.settings = settings;
    }
    async createUser(dto, currentUser) {
        this.validateCreatePermission(dto, currentUser);
        const email = dto.email.toLowerCase().trim();
        const existing = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
        }
        const { schoolId, branchId } = await this.resolveScopeForCreate(dto, currentUser);
        if (currentUser.role !== client_1.UserRole.ADMIN &&
            dto.role !== client_1.UserRole.ADMIN &&
            !schoolId &&
            !branchId) {
            throw new common_1.ForbiddenException('School or branch is required');
        }
        if (dto.role === client_1.UserRole.DIRECTOR) {
            if (currentUser.role !== client_1.UserRole.ADMIN) {
                throw new common_1.ForbiddenException('Only a platform admin can assign a school director');
            }
            if (schoolId) {
                const taken = await this.prisma.user.findFirst({
                    where: { role: client_1.UserRole.DIRECTOR, schoolId },
                });
                if (taken) {
                    throw new common_1.ConflictException('This school already has a director');
                }
            }
        }
        if (dto.role === client_1.UserRole.BRANCH_DIRECTOR) {
            if (currentUser.role !== client_1.UserRole.ADMIN &&
                !(0, school_scope_util_js_1.isSchoolDirector)(currentUser)) {
                throw new common_1.ForbiddenException('Only a platform admin or school director can assign a branch director');
            }
            if (branchId && schoolId) {
                await this.assertBranchInSchool(branchId, schoolId);
            }
            if (!branchId && !schoolId && currentUser.role !== client_1.UserRole.ADMIN) {
                throw new common_1.BadRequestException('schoolId is required for a pool branch director (no branch yet)');
            }
            if ((0, school_scope_util_js_1.isSchoolDirector)(currentUser) &&
                schoolId &&
                currentUser.schoolId &&
                schoolId !== currentUser.schoolId) {
                throw new common_1.ForbiddenException('Branch director must belong to your school');
            }
        }
        if (((0, school_scope_util_js_1.isSchoolDirector)(currentUser) ||
            currentUser.role === client_1.UserRole.DIRECTOR) &&
            branchId &&
            (dto.role === client_1.UserRole.TEACHER || dto.role === client_1.UserRole.STUDENT)) {
            await this.assertBranchInSchool(branchId, currentUser.schoolId);
        }
        if (currentUser.role === client_1.UserRole.BRANCH_DIRECTOR &&
            dto.role === client_1.UserRole.TEACHER) {
            if (!branchId || branchId !== currentUser.branchId) {
                throw new common_1.ForbiddenException('Teachers must be created for your branch only');
            }
        }
        if (currentUser.role === client_1.UserRole.BRANCH_DIRECTOR &&
            dto.role === client_1.UserRole.STUDENT) {
            if (!branchId || branchId !== currentUser.branchId) {
                throw new common_1.ForbiddenException('Students must be created for your branch only');
            }
        }
        let resolvedSchoolId = schoolId;
        let resolvedBranchId = branchId;
        if ((dto.role === client_1.UserRole.TEACHER || dto.role === client_1.UserRole.STUDENT) &&
            branchId) {
            const b = await this.prisma.branch.findUnique({
                where: { id: branchId },
            });
            if (!b) {
                throw new common_1.NotFoundException('Branch not found');
            }
            resolvedSchoolId = b.schoolId;
            resolvedBranchId = branchId;
        }
        const { otpEmailVerificationEnabled } = await this.settings.getPublic();
        const skipInviteEmail = dto.role !== client_1.UserRole.ADMIN && !otpEmailVerificationEnabled;
        const user = await this.prisma.user.create({
            data: {
                email,
                name: dto.name.trim(),
                role: dto.role,
                schoolId: dto.role === client_1.UserRole.DIRECTOR ||
                    dto.role === client_1.UserRole.BRANCH_DIRECTOR
                    ? (schoolId ?? null)
                    : dto.role === client_1.UserRole.TEACHER || dto.role === client_1.UserRole.STUDENT
                        ? resolvedSchoolId
                        : null,
                branchId: dto.role === client_1.UserRole.TEACHER ||
                    dto.role === client_1.UserRole.STUDENT ||
                    dto.role === client_1.UserRole.BRANCH_DIRECTOR
                    ? resolvedBranchId
                    : null,
                staffPosition: null,
                staffClearanceActive: false,
                ...(skipInviteEmail ? { emailVerifiedAt: new Date() } : {}),
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                schoolId: true,
                branchId: true,
                createdAt: true,
                school: { select: { id: true, name: true } },
                branch: { select: { id: true, name: true } },
            },
        });
        if (dto.role !== client_1.UserRole.ADMIN && otpEmailVerificationEnabled) {
            await this.auth.sendInviteOtp(email, currentUser.name ?? undefined);
        }
        return user;
    }
    async getBranchForUser(branchId) {
        const branch = await this.prisma.branch.findUnique({
            where: { id: branchId },
        });
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found');
        }
        return branch;
    }
    async listTeachersForSchoolDirector(currentUser) {
        if ((0, school_scope_util_js_1.isSchoolDirector)(currentUser)) {
            return this.prisma.user.findMany({
                where: {
                    role: client_1.UserRole.TEACHER,
                    branch: { schoolId: currentUser.schoolId },
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
        if (currentUser.role === client_1.UserRole.BRANCH_DIRECTOR && currentUser.branchId) {
            return this.prisma.user.findMany({
                where: {
                    role: client_1.UserRole.TEACHER,
                    branchId: currentUser.branchId,
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
        if (currentUser.role === client_1.UserRole.STUDENT &&
            currentUser.branchId &&
            currentUser.schoolId) {
            return this.prisma.user.findMany({
                where: {
                    role: client_1.UserRole.TEACHER,
                    branchId: currentUser.branchId,
                    schoolId: currentUser.schoolId,
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
        throw new common_1.ForbiddenException('Only a school director, branch director, or student (own branch) can list teachers this way');
    }
    async listBranchDirectorCandidates(schoolId, currentUser) {
        if (!(0, school_scope_util_js_1.canManageSchoolBranches)(currentUser, schoolId)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const school = await this.prisma.school.findUnique({
            where: { id: schoolId },
        });
        if (!school) {
            throw new common_1.NotFoundException('School not found');
        }
        const schoolTied = [
            { schoolId },
            { branch: { schoolId } },
            { schoolId: null, branchId: null },
        ];
        const whereSchoolBds = {
            role: client_1.UserRole.BRANCH_DIRECTOR,
            OR: schoolTied,
        };
        return this.prisma.user.findMany({
            where: whereSchoolBds,
            orderBy: [{ email: 'asc' }],
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                schoolId: true,
                branchId: true,
                createdAt: true,
                branch: { select: { id: true, name: true, schoolId: true } },
                school: { select: { id: true, name: true } },
            },
        });
    }
    async listBySchool(schoolId, currentUser, dto = {}) {
        if (currentUser.role === client_1.UserRole.ADMIN) {
        }
        else if (currentUser.role === client_1.UserRole.DIRECTOR) {
            if (currentUser.schoolId !== schoolId) {
                throw new common_1.ForbiddenException('Cannot access this school');
            }
        }
        else if (currentUser.role === client_1.UserRole.BRANCH_DIRECTOR) {
            if (currentUser.schoolId !== schoolId || !currentUser.branchId) {
                throw new common_1.ForbiddenException('Cannot access this school');
            }
        }
        else if (currentUser.branchId) {
            const branch = await this.prisma.branch.findUnique({
                where: { id: currentUser.branchId },
            });
            if (!branch || branch.schoolId !== schoolId) {
                throw new common_1.ForbiddenException('Cannot access this school');
            }
        }
        else {
            throw new common_1.ForbiddenException('Cannot access this school');
        }
        const school = await this.prisma.school.findUnique({
            where: { id: schoolId },
        });
        if (!school) {
            throw new common_1.NotFoundException('School not found');
        }
        const schoolScope = {
            OR: [
                { schoolId },
                { branch: { schoolId } },
                { role: client_1.UserRole.STUDENT, branch: { schoolId } },
            ],
        };
        const scopedWhere = currentUser.role === client_1.UserRole.BRANCH_DIRECTOR && currentUser.branchId
            ? {
                AND: [
                    schoolScope,
                    {
                        OR: [
                            { branchId: currentUser.branchId },
                            {
                                role: client_1.UserRole.STUDENT,
                                branchId: currentUser.branchId,
                            },
                        ],
                    },
                ],
            }
            : schoolScope;
        const dtoExtra = this.searchDtoFilterParts(dto, {
            includeSchoolIdFilter: false,
        });
        const where = dtoExtra.length > 0
            ? { AND: [scopedWhere, ...dtoExtra] }
            : scopedWhere;
        return this.paginate(this.prisma.user, {
            where,
            orderBy: [{ role: 'desc' }, { email: 'asc' }],
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
        }, dto);
    }
    searchDtoFilterParts(dto, options = {}) {
        const includeSchoolId = options.includeSchoolIdFilter !== false;
        const parts = [];
        if (dto.query?.trim()) {
            const q = dto.query.trim();
            parts.push({
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                ],
            });
        }
        if (dto.role) {
            parts.push({ role: dto.role });
        }
        if (includeSchoolId && dto.schoolId) {
            parts.push({
                OR: [
                    { schoolId: dto.schoolId },
                    { branch: { schoolId: dto.schoolId } },
                ],
            });
        }
        if (dto.branchId) {
            parts.push({ branchId: dto.branchId });
        }
        if (dto.staffPosition) {
            parts.push({ staffPosition: dto.staffPosition });
        }
        if (dto.staffClearanceActive !== undefined) {
            parts.push({ staffClearanceActive: dto.staffClearanceActive });
        }
        return parts;
    }
    async listAll(dto = {}) {
        const parts = this.searchDtoFilterParts(dto, { includeSchoolIdFilter: true });
        const where = parts.length > 0 ? { AND: parts } : {};
        return this.paginate(this.prisma.user, {
            where,
            orderBy: [{ role: 'desc' }, { email: 'asc' }],
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
                school: { select: { id: true, name: true } },
                branch: { select: { id: true, name: true, schoolId: true } },
            },
        }, dto);
    }
    async listUsersForCaller(dto, user) {
        if (user.role === client_1.UserRole.ADMIN) {
            return this.listAll(dto);
        }
        if (user.role !== client_1.UserRole.DIRECTOR && user.role !== client_1.UserRole.BRANCH_DIRECTOR) {
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
        const and = [];
        if (currentUser.role !== client_1.UserRole.ADMIN) {
            if ((0, school_scope_util_js_1.isSchoolDirector)(currentUser)) {
                and.push({
                    OR: [
                        { schoolId: currentUser.schoolId },
                        { branch: { schoolId: currentUser.schoolId } },
                    ],
                });
            }
            else if (currentUser.role === client_1.UserRole.BRANCH_DIRECTOR) {
                and.push({ branchId: currentUser.branchId });
            }
            else {
                and.push({ id: currentUser.id });
            }
        }
        if (dto.query?.trim()) {
            const q = dto.query.trim();
            and.push({
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                ],
            });
        }
        if (dto.role) {
            and.push({ role: dto.role });
        }
        if (dto.schoolId && currentUser.role === client_1.UserRole.ADMIN) {
            and.push({ schoolId: dto.schoolId });
        }
        if (dto.branchId) {
            and.push({ branchId: dto.branchId });
        }
        if (dto.staffPosition) {
            and.push({ staffPosition: dto.staffPosition });
        }
        if (dto.staffClearanceActive !== undefined) {
            and.push({ staffClearanceActive: dto.staffClearanceActive });
        }
        const where = and.length > 0 ? { AND: and } : {};
        return this.paginate(this.prisma.user, {
            where,
            orderBy: [{ role: 'desc' }, { name: 'asc' }],
            include: {
                school: true,
                branch: true,
            },
        }, dto);
    }
    async paginate(model, args, params) {
        const page = Math.max(1, params.page || 1);
        const limit = Math.max(1, Math.min(100, params.limit || 20));
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            model.findMany({
                ...args,
                take: limit,
                skip,
            }),
            model.count({ where: args.where }),
        ]);
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
        const user = await this.prisma.user.findUnique({
            where: { id: targetId },
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
                branch: { select: { id: true, name: true, schoolId: true } },
                school: { select: { id: true, name: true } },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (actor.role !== client_1.UserRole.ADMIN && actor.id !== targetId) {
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
        const user = await this.prisma.user.findUnique({
            where: { id: targetId },
            include: {
                school: true,
                branch: true,
                directorProfile: true,
                branchDirectorProfile: true,
                teacherProfile: true,
                studentProfile: true,
                ownerDocuments: {
                    include: {
                        documentType: true,
                        uploadedBy: { select: { id: true, name: true, email: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                requiredDocTypes: {
                    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (actor.role !== client_1.UserRole.ADMIN && actor.id !== targetId) {
            const isSuperior = await this.isSuperiorOf(actor, user);
            if (!isSuperior) {
                throw new common_1.ForbiddenException('Cannot access this user details');
            }
        }
        return user;
    }
    async isSuperiorOf(actor, target) {
        if (actor.role === client_1.UserRole.ADMIN)
            return true;
        if ((0, school_scope_util_js_1.isSchoolDirector)(actor)) {
            if (!actor.schoolId)
                return false;
            return this.userBelongsToSchool(target.id, actor.schoolId);
        }
        if (actor.role === client_1.UserRole.BRANCH_DIRECTOR) {
            if (!actor.branchId)
                return false;
            return this.userBelongsToBranchScope(target.id, actor.branchId);
        }
        return false;
    }
    async updateUser(targetId, dto, actor) {
        const adminScopePatch = actor.role === client_1.UserRole.ADMIN &&
            (dto.schoolId !== undefined || dto.branchId !== undefined);
        if (dto.name === undefined &&
            (dto.password === undefined || dto.password === '') &&
            !adminScopePatch) {
            throw new common_1.BadRequestException('Provide name and/or a new password to update');
        }
        if ((dto.schoolId !== undefined || dto.branchId !== undefined) &&
            actor.role !== client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only a platform admin can assign school or branch');
        }
        const target = await this.prisma.user.findUnique({
            where: { id: targetId },
            select: {
                id: true,
                role: true,
                schoolId: true,
                branchId: true,
            },
        });
        if (!target) {
            throw new common_1.NotFoundException('User not found');
        }
        if (target.role === client_1.UserRole.ADMIN && adminScopePatch) {
            throw new common_1.BadRequestException('Cannot assign school or branch to a platform admin');
        }
        if (actor.id === target.id) {
            if (actor.role !== client_1.UserRole.ADMIN) {
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
        if (actor.role === client_1.UserRole.ADMIN && dto.schoolId !== undefined) {
            const sid = dto.schoolId.trim();
            if (target.role === client_1.UserRole.DIRECTOR) {
                if (sid) {
                    const taken = await this.prisma.user.findFirst({
                        where: {
                            role: client_1.UserRole.DIRECTOR,
                            schoolId: sid,
                            NOT: { id: targetId },
                        },
                    });
                    if (taken) {
                        throw new common_1.ConflictException('This school already has a director');
                    }
                }
                data.schoolId = sid || null;
                data.branchId = null;
            }
            else if (target.role === client_1.UserRole.BRANCH_DIRECTOR) {
                data.schoolId = sid || null;
                if (!sid) {
                    data.branchId = null;
                }
            }
        }
        if (actor.role === client_1.UserRole.ADMIN && dto.branchId !== undefined) {
            const bid = dto.branchId.trim();
            if (target.role === client_1.UserRole.TEACHER) {
                if (bid) {
                    const b = await this.prisma.branch.findUnique({ where: { id: bid } });
                    if (!b) {
                        throw new common_1.NotFoundException('Branch not found');
                    }
                    data.branchId = bid;
                }
                else {
                    data.branchId = null;
                }
            }
            else if (target.role === client_1.UserRole.BRANCH_DIRECTOR && bid) {
                const b = await this.prisma.branch.findUnique({ where: { id: bid } });
                if (!b) {
                    throw new common_1.NotFoundException('Branch not found');
                }
                data.branchId = bid;
                data.schoolId = b.schoolId;
            }
        }
        return this.prisma.user.update({
            where: { id: targetId },
            data,
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
                school: { select: { id: true, name: true } },
                branch: { select: { id: true, name: true, schoolId: true } },
            },
        });
    }
    async assertBranchInSchool(branchId, schoolId) {
        const branch = await this.prisma.branch.findUnique({
            where: { id: branchId },
        });
        if (!branch || branch.schoolId !== schoolId) {
            throw new common_1.ForbiddenException('Branch is not in your school');
        }
    }
    async assertSuperiorCanPatchUser(actor, target) {
        if (actor.role === client_1.UserRole.ADMIN) {
            return;
        }
        if (target.role === client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only a platform admin can edit this account');
        }
        if (actor.role === client_1.UserRole.DIRECTOR) {
            if (!actor.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a school');
            }
            if (target.role === client_1.UserRole.DIRECTOR) {
                throw new common_1.ForbiddenException('Only a platform admin can edit the school director');
            }
            const ok = await this.userBelongsToSchool(target.id, actor.schoolId);
            if (!ok) {
                throw new common_1.ForbiddenException('User is not in your school');
            }
            return;
        }
        if (actor.role === client_1.UserRole.BRANCH_DIRECTOR) {
            if (!actor.branchId || !actor.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a branch');
            }
            if (target.role === client_1.UserRole.DIRECTOR ||
                target.role === client_1.UserRole.BRANCH_DIRECTOR) {
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
        const u = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                schoolId: true,
                role: true,
                branch: { select: { schoolId: true } },
            },
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
        const u = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                branchId: true,
            },
        });
        if (!u)
            return false;
        if (u.role === client_1.UserRole.TEACHER ||
            u.role === client_1.UserRole.BRANCH_DIRECTOR ||
            u.role === client_1.UserRole.STUDENT) {
            return u.branchId === branchId;
        }
        return false;
    }
    validateCreatePermission(dto, currentUser) {
        if (currentUser.role === client_1.UserRole.ADMIN) {
            return;
        }
        if (currentUser.role === client_1.UserRole.DIRECTOR) {
            if (!currentUser.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a school');
            }
            if (dto.role !== client_1.UserRole.TEACHER &&
                dto.role !== client_1.UserRole.STUDENT &&
                dto.role !== client_1.UserRole.BRANCH_DIRECTOR) {
                throw new common_1.ForbiddenException('You can only create teachers, students, or branch directors');
            }
            return;
        }
        if (currentUser.role === client_1.UserRole.BRANCH_DIRECTOR) {
            if (dto.role !== client_1.UserRole.TEACHER && dto.role !== client_1.UserRole.STUDENT) {
                throw new common_1.ForbiddenException('You can only create teachers or students for your branch');
            }
            return;
        }
        throw new common_1.ForbiddenException('Insufficient permissions');
    }
    async resolveScopeForCreate(dto, currentUser) {
        if (dto.role === client_1.UserRole.ADMIN) {
            return { schoolId: null, branchId: null };
        }
        if (currentUser.role === client_1.UserRole.ADMIN) {
            if (dto.role === client_1.UserRole.DIRECTOR) {
                return { schoolId: dto.schoolId ?? null, branchId: null };
            }
            if (dto.role === client_1.UserRole.BRANCH_DIRECTOR) {
                if (dto.branchId) {
                    const b = await this.prisma.branch.findUnique({
                        where: { id: dto.branchId },
                    });
                    if (!b) {
                        throw new common_1.NotFoundException('Branch not found');
                    }
                    return { schoolId: b.schoolId, branchId: dto.branchId };
                }
                return { schoolId: dto.schoolId ?? null, branchId: null };
            }
            if (dto.role === client_1.UserRole.TEACHER || dto.role === client_1.UserRole.STUDENT) {
                return { schoolId: null, branchId: dto.branchId ?? null };
            }
            return { schoolId: null, branchId: null };
        }
        if (currentUser.role === client_1.UserRole.DIRECTOR) {
            if (!currentUser.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a school');
            }
            if (dto.role === client_1.UserRole.BRANCH_DIRECTOR) {
                if (dto.branchId) {
                    return { schoolId: currentUser.schoolId, branchId: dto.branchId };
                }
                return { schoolId: currentUser.schoolId, branchId: null };
            }
            return { schoolId: null, branchId: dto.branchId ?? null };
        }
        if (currentUser.role === client_1.UserRole.BRANCH_DIRECTOR) {
            if (!currentUser.branchId || !currentUser.schoolId) {
                throw new common_1.ForbiddenException('Your account is not linked to a branch');
            }
            return { schoolId: currentUser.schoolId, branchId: currentUser.branchId };
        }
        throw new common_1.ForbiddenException('Insufficient permissions');
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        auth_service_js_1.AuthService,
        settings_service_js_1.SettingsService])
], UserService);
//# sourceMappingURL=user.service.js.map
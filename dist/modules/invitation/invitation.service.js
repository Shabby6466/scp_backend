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
exports.InvitationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const invitation_entity_1 = require("../../entities/invitation.entity");
const database_enum_1 = require("../common/enums/database.enum");
const mailer_service_1 = require("../mailer/mailer.service");
const school_scope_util_1 = require("../auth/school-scope.util");
const school_service_1 = require("../school/school.service");
const branch_service_1 = require("../branch/branch.service");
const user_service_1 = require("../user/user.service");
const DIRECTOR_INVITE_ROLES = [
    database_enum_1.UserRole.BRANCH_DIRECTOR,
    database_enum_1.UserRole.TEACHER,
    database_enum_1.UserRole.STUDENT,
    database_enum_1.UserRole.PARENT,
];
const BRANCH_DIRECTOR_INVITE_ROLES = [
    database_enum_1.UserRole.TEACHER,
    database_enum_1.UserRole.STUDENT,
    database_enum_1.UserRole.PARENT,
];
function toClientInvitation(inv) {
    return {
        ...inv,
        status: inv.status.toLowerCase(),
    };
}
let InvitationService = class InvitationService {
    constructor(invitationRepository, schoolService, branchService, userService, mailerService) {
        this.invitationRepository = invitationRepository;
        this.schoolService = schoolService;
        this.branchService = branchService;
        this.userService = userService;
        this.mailerService = mailerService;
    }
    canInviteTargetRole(inviterRole, targetRole) {
        if (inviterRole === database_enum_1.UserRole.ADMIN)
            return true;
        if (inviterRole === database_enum_1.UserRole.DIRECTOR) {
            return DIRECTOR_INVITE_ROLES.includes(targetRole);
        }
        if (inviterRole === database_enum_1.UserRole.BRANCH_DIRECTOR) {
            return BRANCH_DIRECTOR_INVITE_ROLES.includes(targetRole);
        }
        return false;
    }
    async ensureBranchBelongsToSchool(branchId, schoolId) {
        const branch = await this.branchService.findOneById(branchId);
        if (!branch || branch.schoolId !== schoolId) {
            throw new common_1.BadRequestException('Branch does not belong to this school');
        }
    }
    ensureCanSendForScope(user, schoolId, branchId) {
        if (user.role === database_enum_1.UserRole.ADMIN) {
            return;
        }
        if (user.role === database_enum_1.UserRole.DIRECTOR) {
            if (!(0, school_scope_util_1.directorOwnsBranchSchool)(user, schoolId)) {
                throw new common_1.ForbiddenException('Cannot invite for this school');
            }
            return;
        }
        if (user.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
            if (user.schoolId !== schoolId || !user.branchId) {
                throw new common_1.ForbiddenException('Cannot invite for this school or branch');
            }
            if (branchId != null && branchId !== user.branchId) {
                throw new common_1.ForbiddenException('Cannot invite for another branch');
            }
            return;
        }
        throw new common_1.ForbiddenException('You cannot send invitations');
    }
    async send(dto, user) {
        if (!this.canInviteTargetRole(user.role, dto.role)) {
            throw new common_1.ForbiddenException('You cannot invite users with this role');
        }
        const school = await this.schoolService.findOneInternal(dto.schoolId);
        if (!school) {
            throw new common_1.NotFoundException('School not found');
        }
        const branchId = dto.branchId ??
            (user.role === database_enum_1.UserRole.BRANCH_DIRECTOR ? user.branchId : null);
        if (user.role === database_enum_1.UserRole.BRANCH_DIRECTOR && !branchId) {
            throw new common_1.BadRequestException('Branch is required for this invitation');
        }
        if (dto.branchId) {
            await this.ensureBranchBelongsToSchool(dto.branchId, dto.schoolId);
        }
        this.ensureCanSendForScope(user, dto.schoolId, branchId);
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const invitation = this.invitationRepository.create({
            schoolId: dto.schoolId,
            branchId,
            email: dto.email.trim().toLowerCase(),
            role: dto.role,
            token,
            expiresAt,
            sentById: user.id,
            status: database_enum_1.InvitationStatus.PENDING,
        });
        await this.invitationRepository.save(invitation);
        await this.mailerService.sendInvite(invitation.email, token, user.name ?? undefined);
        return toClientInvitation(invitation);
    }
    async findAll(user, schoolId, branchId, status) {
        const where = {};
        if (status?.trim()) {
            const u = status.trim().toUpperCase();
            if (Object.values(database_enum_1.InvitationStatus).includes(u)) {
                where.status = u;
            }
        }
        if (branchId) {
            where.branchId = branchId;
        }
        if (user.role === database_enum_1.UserRole.ADMIN) {
            if (schoolId)
                where.schoolId = schoolId;
        }
        else if (user.role === database_enum_1.UserRole.DIRECTOR) {
            const sid = schoolId ?? user.schoolId;
            if (!sid || !(0, school_scope_util_1.directorOwnsBranchSchool)(user, sid)) {
                throw new common_1.ForbiddenException('Cannot list invitations for this school');
            }
            where.schoolId = sid;
        }
        else if (user.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
            if (!user.branchId || !user.schoolId) {
                throw new common_1.ForbiddenException('Cannot list invitations');
            }
            if (schoolId && schoolId !== user.schoolId) {
                throw new common_1.ForbiddenException('Cannot list invitations for this school');
            }
            where.schoolId = user.schoolId;
            if (!where.branchId) {
                where.branchId = branchId ?? user.branchId;
            }
        }
        else {
            throw new common_1.ForbiddenException('Cannot list invitations');
        }
        const rows = await this.invitationRepository.find({
            where,
            order: { createdAt: 'DESC' },
        });
        return rows.map(toClientInvitation);
    }
    async validate(token) {
        const invitation = await this.invitationRepository.findOne({
            where: { token },
        });
        if (!invitation) {
            return { valid: false };
        }
        if (invitation.status !== database_enum_1.InvitationStatus.PENDING) {
            return { valid: false };
        }
        if (invitation.expiresAt.getTime() <= Date.now()) {
            return { valid: false };
        }
        return { valid: true, invitation };
    }
    async accept(token, userId) {
        const invitation = await this.invitationRepository.findOne({
            where: { token },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation not found');
        }
        if (invitation.status !== database_enum_1.InvitationStatus.PENDING) {
            throw new common_1.BadRequestException('Invitation is no longer pending');
        }
        if (invitation.expiresAt.getTime() <= Date.now()) {
            throw new common_1.BadRequestException('Invitation has expired');
        }
        const acceptingUser = await this.userService.findOneInternal(userId);
        if (!acceptingUser) {
            throw new common_1.NotFoundException('User not found');
        }
        invitation.status = database_enum_1.InvitationStatus.ACCEPTED;
        invitation.acceptedAt = new Date();
        return this.invitationRepository.save(invitation);
    }
    canRevoke(user, invitation) {
        if (invitation.sentById && invitation.sentById === user.id) {
            return true;
        }
        if (user.role === database_enum_1.UserRole.ADMIN) {
            return true;
        }
        if (user.role === database_enum_1.UserRole.DIRECTOR &&
            (0, school_scope_util_1.directorOwnsBranchSchool)(user, invitation.schoolId)) {
            return true;
        }
        return false;
    }
    async revoke(id, user) {
        const invitation = await this.invitationRepository.findOne({
            where: { id },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation not found');
        }
        if (!this.canRevoke(user, invitation)) {
            throw new common_1.ForbiddenException('Cannot revoke this invitation');
        }
        if (invitation.status === database_enum_1.InvitationStatus.ACCEPTED) {
            throw new common_1.BadRequestException('Cannot revoke an accepted invitation');
        }
        if (invitation.status === database_enum_1.InvitationStatus.REVOKED) {
            return invitation;
        }
        invitation.status = database_enum_1.InvitationStatus.REVOKED;
        return this.invitationRepository.save(invitation);
    }
};
exports.InvitationService = InvitationService;
exports.InvitationService = InvitationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(invitation_entity_1.Invitation)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => school_service_1.SchoolService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => branch_service_1.BranchService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_service_1.UserService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        school_service_1.SchoolService,
        branch_service_1.BranchService,
        user_service_1.UserService,
        mailer_service_1.MailerService])
], InvitationService);
//# sourceMappingURL=invitation.service.js.map
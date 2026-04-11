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
exports.InvitationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const mailer_service_js_1 = require("../mailer/mailer.service.js");
const school_scope_util_js_1 = require("../auth/school-scope.util.js");
const DIRECTOR_INVITE_ROLES = [
    client_1.UserRole.BRANCH_DIRECTOR,
    client_1.UserRole.TEACHER,
    client_1.UserRole.STUDENT,
    client_1.UserRole.PARENT,
];
const BRANCH_DIRECTOR_INVITE_ROLES = [
    client_1.UserRole.TEACHER,
    client_1.UserRole.STUDENT,
    client_1.UserRole.PARENT,
];
function toClientInvitation(inv) {
    return {
        ...inv,
        status: inv.status.toLowerCase(),
    };
}
let InvitationService = class InvitationService {
    prisma;
    mailerService;
    constructor(prisma, mailerService) {
        this.prisma = prisma;
        this.mailerService = mailerService;
    }
    canInviteTargetRole(inviterRole, targetRole) {
        if (inviterRole === client_1.UserRole.ADMIN)
            return true;
        if (inviterRole === client_1.UserRole.DIRECTOR) {
            return DIRECTOR_INVITE_ROLES.includes(targetRole);
        }
        if (inviterRole === client_1.UserRole.BRANCH_DIRECTOR) {
            return BRANCH_DIRECTOR_INVITE_ROLES.includes(targetRole);
        }
        return false;
    }
    async ensureBranchBelongsToSchool(branchId, schoolId) {
        const branch = await this.prisma.branch.findFirst({
            where: { id: branchId, schoolId },
        });
        if (!branch) {
            throw new common_1.BadRequestException('Branch does not belong to this school');
        }
    }
    ensureCanSendForScope(user, schoolId, branchId) {
        if (user.role === client_1.UserRole.ADMIN) {
            return;
        }
        if (user.role === client_1.UserRole.DIRECTOR) {
            if (!(0, school_scope_util_js_1.directorOwnsBranchSchool)(user, schoolId)) {
                throw new common_1.ForbiddenException('Cannot invite for this school');
            }
            return;
        }
        if (user.role === client_1.UserRole.BRANCH_DIRECTOR) {
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
        const school = await this.prisma.school.findUnique({
            where: { id: dto.schoolId },
        });
        if (!school) {
            throw new common_1.NotFoundException('School not found');
        }
        const branchId = dto.branchId ??
            (user.role === client_1.UserRole.BRANCH_DIRECTOR ? user.branchId : null);
        if (user.role === client_1.UserRole.BRANCH_DIRECTOR && !branchId) {
            throw new common_1.BadRequestException('Branch is required for this invitation');
        }
        if (dto.branchId) {
            await this.ensureBranchBelongsToSchool(dto.branchId, dto.schoolId);
        }
        this.ensureCanSendForScope(user, dto.schoolId, branchId);
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const invitation = await this.prisma.invitation.create({
            data: {
                schoolId: dto.schoolId,
                branchId,
                email: dto.email.trim().toLowerCase(),
                role: dto.role,
                token,
                expiresAt,
                sentById: user.id,
                status: client_1.InvitationStatus.PENDING,
            },
        });
        await this.mailerService.sendInvite(invitation.email, token, user.name ?? undefined);
        return toClientInvitation(invitation);
    }
    async findAll(user, schoolId, branchId, status) {
        const where = {};
        if (status?.trim()) {
            const u = status.trim().toUpperCase();
            if (client_1.InvitationStatus[u]) {
                where.status = u;
            }
        }
        if (branchId) {
            where.branchId = branchId;
        }
        if (user.role === client_1.UserRole.ADMIN) {
            if (schoolId)
                where.schoolId = schoolId;
        }
        else if (user.role === client_1.UserRole.DIRECTOR) {
            const sid = schoolId ?? user.schoolId;
            if (!sid || !(0, school_scope_util_js_1.directorOwnsBranchSchool)(user, sid)) {
                throw new common_1.ForbiddenException('Cannot list invitations for this school');
            }
            where.schoolId = sid;
        }
        else if (user.role === client_1.UserRole.BRANCH_DIRECTOR) {
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
        const rows = await this.prisma.invitation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return rows.map(toClientInvitation);
    }
    async validate(token) {
        const invitation = await this.prisma.invitation.findUnique({
            where: { token },
        });
        if (!invitation) {
            return { valid: false };
        }
        if (invitation.status !== client_1.InvitationStatus.PENDING) {
            return { valid: false };
        }
        if (invitation.expiresAt.getTime() <= Date.now()) {
            return { valid: false };
        }
        return { valid: true, invitation };
    }
    async accept(token, userId) {
        const invitation = await this.prisma.invitation.findUnique({
            where: { token },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation not found');
        }
        if (invitation.status !== client_1.InvitationStatus.PENDING) {
            throw new common_1.BadRequestException('Invitation is no longer pending');
        }
        if (invitation.expiresAt.getTime() <= Date.now()) {
            throw new common_1.BadRequestException('Invitation has expired');
        }
        const acceptingUser = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!acceptingUser) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.prisma.invitation.update({
            where: { id: invitation.id },
            data: {
                status: client_1.InvitationStatus.ACCEPTED,
                acceptedAt: new Date(),
            },
        });
    }
    canRevoke(user, invitation) {
        if (invitation.sentById && invitation.sentById === user.id) {
            return true;
        }
        if (user.role === client_1.UserRole.ADMIN) {
            return true;
        }
        if (user.role === client_1.UserRole.DIRECTOR &&
            (0, school_scope_util_js_1.directorOwnsBranchSchool)(user, invitation.schoolId)) {
            return true;
        }
        return false;
    }
    async revoke(id, user) {
        const invitation = await this.prisma.invitation.findUnique({
            where: { id },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation not found');
        }
        if (!this.canRevoke(user, invitation)) {
            throw new common_1.ForbiddenException('Cannot revoke this invitation');
        }
        if (invitation.status === client_1.InvitationStatus.ACCEPTED) {
            throw new common_1.BadRequestException('Cannot revoke an accepted invitation');
        }
        if (invitation.status === client_1.InvitationStatus.REVOKED) {
            return invitation;
        }
        return this.prisma.invitation.update({
            where: { id },
            data: { status: client_1.InvitationStatus.REVOKED },
        });
    }
};
exports.InvitationService = InvitationService;
exports.InvitationService = InvitationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        mailer_service_js_1.MailerService])
], InvitationService);
//# sourceMappingURL=invitation.service.js.map
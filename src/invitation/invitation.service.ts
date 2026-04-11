import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Invitation,
  InvitationStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailerService } from '../mailer/mailer.service.js';
import { directorOwnsBranchSchool } from '../auth/school-scope.util.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';

const DIRECTOR_INVITE_ROLES: UserRole[] = [
  UserRole.BRANCH_DIRECTOR,
  UserRole.TEACHER,
  UserRole.STUDENT,
  UserRole.PARENT,
];

const BRANCH_DIRECTOR_INVITE_ROLES: UserRole[] = [
  UserRole.TEACHER,
  UserRole.STUDENT,
  UserRole.PARENT,
];

export type InvitationActor = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

function toClientInvitation(inv: Invitation) {
  return {
    ...inv,
    status: inv.status.toLowerCase(),
  };
}

@Injectable()
export class InvitationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  private canInviteTargetRole(
    inviterRole: UserRole,
    targetRole: UserRole,
  ): boolean {
    if (inviterRole === UserRole.ADMIN) return true;
    if (inviterRole === UserRole.DIRECTOR) {
      return DIRECTOR_INVITE_ROLES.includes(targetRole);
    }
    if (inviterRole === UserRole.BRANCH_DIRECTOR) {
      return BRANCH_DIRECTOR_INVITE_ROLES.includes(targetRole);
    }
    return false;
  }

  private async ensureBranchBelongsToSchool(
    branchId: string,
    schoolId: string,
  ): Promise<void> {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, schoolId },
    });
    if (!branch) {
      throw new BadRequestException('Branch does not belong to this school');
    }
  }

  private ensureCanSendForScope(
    user: InvitationActor,
    schoolId: string,
    branchId: string | null,
  ): void {
    if (user.role === UserRole.ADMIN) {
      return;
    }
    if (user.role === UserRole.DIRECTOR) {
      if (!directorOwnsBranchSchool(user, schoolId)) {
        throw new ForbiddenException('Cannot invite for this school');
      }
      return;
    }
    if (user.role === UserRole.BRANCH_DIRECTOR) {
      if (user.schoolId !== schoolId || !user.branchId) {
        throw new ForbiddenException('Cannot invite for this school or branch');
      }
      if (branchId != null && branchId !== user.branchId) {
        throw new ForbiddenException('Cannot invite for another branch');
      }
      return;
    }
    throw new ForbiddenException('You cannot send invitations');
  }

  async send(
    dto: CreateInvitationDto,
    user: InvitationActor,
  ): Promise<ReturnType<typeof toClientInvitation>> {
    if (!this.canInviteTargetRole(user.role, dto.role)) {
      throw new ForbiddenException('You cannot invite users with this role');
    }

    const school = await this.prisma.school.findUnique({
      where: { id: dto.schoolId },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const branchId =
      dto.branchId ??
      (user.role === UserRole.BRANCH_DIRECTOR ? user.branchId : null);

    if (user.role === UserRole.BRANCH_DIRECTOR && !branchId) {
      throw new BadRequestException('Branch is required for this invitation');
    }

    if (dto.branchId) {
      await this.ensureBranchBelongsToSchool(dto.branchId, dto.schoolId);
    }

    this.ensureCanSendForScope(user, dto.schoolId, branchId);

    const token = randomBytes(32).toString('hex');
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
        status: InvitationStatus.PENDING,
      },
    });

    await this.mailerService.sendInvite(
      invitation.email,
      token,
      user.name ?? undefined,
    );

    return toClientInvitation(invitation);
  }

  async findAll(
    user: InvitationActor,
    schoolId?: string,
    branchId?: string,
    status?: string,
  ): Promise<ReturnType<typeof toClientInvitation>[]> {
    const where: Prisma.InvitationWhereInput = {};

    if (status?.trim()) {
      const u = status.trim().toUpperCase();
      if ((InvitationStatus as unknown as Record<string, string>)[u]) {
        where.status = u as InvitationStatus;
      }
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (user.role === UserRole.ADMIN) {
      if (schoolId) where.schoolId = schoolId;
    } else if (user.role === UserRole.DIRECTOR) {
      const sid = schoolId ?? user.schoolId;
      if (!sid || !directorOwnsBranchSchool(user, sid)) {
        throw new ForbiddenException('Cannot list invitations for this school');
      }
      where.schoolId = sid;
    } else if (user.role === UserRole.BRANCH_DIRECTOR) {
      if (!user.branchId || !user.schoolId) {
        throw new ForbiddenException('Cannot list invitations');
      }
      if (schoolId && schoolId !== user.schoolId) {
        throw new ForbiddenException('Cannot list invitations for this school');
      }
      where.schoolId = user.schoolId;
      if (!where.branchId) {
        where.branchId = branchId ?? user.branchId;
      }
    } else {
      throw new ForbiddenException('Cannot list invitations');
    }

    const rows = await this.prisma.invitation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toClientInvitation);
  }

  async validate(
    token: string,
  ): Promise<{ valid: boolean; invitation?: Invitation }> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });
    if (!invitation) {
      return { valid: false };
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      return { valid: false };
    }
    if (invitation.expiresAt.getTime() <= Date.now()) {
      return { valid: false };
    }
    return { valid: true, invitation };
  }

  async accept(token: string, userId: string): Promise<Invitation> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is no longer pending');
    }
    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Invitation has expired');
    }

    const acceptingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!acceptingUser) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: InvitationStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });
  }

  private canRevoke(user: InvitationActor, invitation: Invitation): boolean {
    if (invitation.sentById && invitation.sentById === user.id) {
      return true;
    }
    if (user.role === UserRole.ADMIN) {
      return true;
    }
    if (
      user.role === UserRole.DIRECTOR &&
      directorOwnsBranchSchool(user, invitation.schoolId)
    ) {
      return true;
    }
    return false;
  }

  async revoke(id: string, user: InvitationActor): Promise<Invitation> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (!this.canRevoke(user, invitation)) {
      throw new ForbiddenException('Cannot revoke this invitation');
    }
    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new BadRequestException('Cannot revoke an accepted invitation');
    }
    if (invitation.status === InvitationStatus.REVOKED) {
      return invitation;
    }

    return this.prisma.invitation.update({
      where: { id },
      data: { status: InvitationStatus.REVOKED },
    });
  }
}

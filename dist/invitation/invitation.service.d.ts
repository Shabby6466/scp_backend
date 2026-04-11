import { Invitation, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailerService } from '../mailer/mailer.service.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
export type InvitationActor = {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
};
declare function toClientInvitation(inv: Invitation): {
    status: string;
    id: string;
    email: string;
    token: string;
    role: import("@prisma/client").$Enums.UserRole;
    schoolId: string;
    branchId: string | null;
    createdAt: Date;
    expiresAt: Date;
    sentById: string | null;
    acceptedAt: Date | null;
};
export declare class InvitationService {
    private readonly prisma;
    private readonly mailerService;
    constructor(prisma: PrismaService, mailerService: MailerService);
    private canInviteTargetRole;
    private ensureBranchBelongsToSchool;
    private ensureCanSendForScope;
    send(dto: CreateInvitationDto, user: InvitationActor): Promise<ReturnType<typeof toClientInvitation>>;
    findAll(user: InvitationActor, schoolId?: string, branchId?: string, status?: string): Promise<ReturnType<typeof toClientInvitation>[]>;
    validate(token: string): Promise<{
        valid: boolean;
        invitation?: Invitation;
    }>;
    accept(token: string, userId: string): Promise<Invitation>;
    private canRevoke;
    revoke(id: string, user: InvitationActor): Promise<Invitation>;
}
export {};

import { UserRole } from '@prisma/client';
import { InvitationService } from './invitation.service.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
declare class AcceptInvitationDto {
    userId: string;
}
declare class SendParentInvitationDto {
    schoolId: string;
    branchId?: string;
    email: string;
}
declare class SendDirectorInvitationDto {
    schoolId: string;
    email: string;
}
export declare class InvitationController {
    private readonly invitationService;
    constructor(invitationService: InvitationService);
    send(dto: CreateInvitationDto, user: {
        id: string;
        email: string;
        name: string | null;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    }>;
    sendParent(dto: SendParentInvitationDto, user: {
        id: string;
        email: string;
        name: string | null;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    }>;
    sendDirector(dto: SendDirectorInvitationDto, user: {
        id: string;
        email: string;
        name: string | null;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    }>;
    validate(token: string): Promise<{
        valid: boolean;
        invitation?: import("@prisma/client").Invitation;
    }>;
    findAll(schoolId: string | undefined, branchId: string | undefined, status: string | undefined, user: {
        id: string;
        email: string;
        name: string | null;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    }[]>;
    accept(token: string, body: AcceptInvitationDto): Promise<{
        id: string;
        email: string;
        token: string;
        role: import("@prisma/client").$Enums.UserRole;
        schoolId: string;
        branchId: string | null;
        createdAt: Date;
        expiresAt: Date;
        status: import("@prisma/client").$Enums.InvitationStatus;
        sentById: string | null;
        acceptedAt: Date | null;
    }>;
    revoke(id: string, user: {
        id: string;
        email: string;
        name: string | null;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        id: string;
        email: string;
        token: string;
        role: import("@prisma/client").$Enums.UserRole;
        schoolId: string;
        branchId: string | null;
        createdAt: Date;
        expiresAt: Date;
        status: import("@prisma/client").$Enums.InvitationStatus;
        sentById: string | null;
        acceptedAt: Date | null;
    }>;
}
export {};

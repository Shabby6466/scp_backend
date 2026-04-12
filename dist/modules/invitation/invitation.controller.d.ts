import { UserRole } from '../common/enums/database.enum';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
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
        email: string;
        role: UserRole;
        token: string;
        expiresAt: Date;
        acceptedAt: Date | null;
        schoolId: string;
        branchId: string | null;
        sentById: string;
        school: import("../../entities/school.entity").School;
        branch: import("../../entities/branch.entity").Branch;
        sentBy: import("../../entities/user.entity").User;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt?: Date | null;
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
        email: string;
        role: UserRole;
        token: string;
        expiresAt: Date;
        acceptedAt: Date | null;
        schoolId: string;
        branchId: string | null;
        sentById: string;
        school: import("../../entities/school.entity").School;
        branch: import("../../entities/branch.entity").Branch;
        sentBy: import("../../entities/user.entity").User;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt?: Date | null;
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
        email: string;
        role: UserRole;
        token: string;
        expiresAt: Date;
        acceptedAt: Date | null;
        schoolId: string;
        branchId: string | null;
        sentById: string;
        school: import("../../entities/school.entity").School;
        branch: import("../../entities/branch.entity").Branch;
        sentBy: import("../../entities/user.entity").User;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt?: Date | null;
    }>;
    validate(token: string): Promise<{
        valid: boolean;
        invitation?: import("../../entities/invitation.entity").Invitation;
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
        email: string;
        role: UserRole;
        token: string;
        expiresAt: Date;
        acceptedAt: Date | null;
        schoolId: string;
        branchId: string | null;
        sentById: string;
        school: import("../../entities/school.entity").School;
        branch: import("../../entities/branch.entity").Branch;
        sentBy: import("../../entities/user.entity").User;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt?: Date | null;
    }[]>;
    accept(token: string, body: AcceptInvitationDto): Promise<import("../../entities/invitation.entity").Invitation>;
    revoke(id: string, user: {
        id: string;
        email: string;
        name: string | null;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/invitation.entity").Invitation>;
}
export {};

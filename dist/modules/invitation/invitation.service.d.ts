import { Repository } from 'typeorm';
import { Invitation } from '../../entities/invitation.entity';
import { UserRole } from '../common/enums/database.enum';
import { MailerService } from '../mailer/mailer.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { SchoolService } from '../school/school.service';
import { BranchService } from '../branch/branch.service';
import { UserService } from '../user/user.service';
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
};
export declare class InvitationService {
    private readonly invitationRepository;
    private readonly schoolService;
    private readonly branchService;
    private readonly userService;
    private readonly mailerService;
    constructor(invitationRepository: Repository<Invitation>, schoolService: SchoolService, branchService: BranchService, userService: UserService, mailerService: MailerService);
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

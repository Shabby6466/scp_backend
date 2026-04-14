import { BaseEntity } from './base.entity';
import { InvitationStatus, UserRole } from '../modules/common/enums/database.enum';
import { School } from './school.entity';
import { Branch } from './branch.entity';
import { User } from './user.entity';
export declare class Invitation extends BaseEntity {
    email: string;
    role: UserRole;
    token: string;
    status: InvitationStatus;
    expiresAt: Date;
    acceptedAt: Date | null;
    schoolId: string;
    branchId: string | null;
    sentById: string;
    school: School;
    branch: Branch;
    sentBy: User;
}

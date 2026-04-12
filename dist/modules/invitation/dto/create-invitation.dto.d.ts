import { UserRole } from '../../common/enums/database.enum';
export declare class CreateInvitationDto {
    schoolId: string;
    branchId?: string;
    email: string;
    role: UserRole;
}

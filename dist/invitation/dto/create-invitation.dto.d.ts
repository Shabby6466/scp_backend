import { UserRole } from '@prisma/client';
export declare class CreateInvitationDto {
    schoolId: string;
    branchId?: string;
    email: string;
    role: UserRole;
}

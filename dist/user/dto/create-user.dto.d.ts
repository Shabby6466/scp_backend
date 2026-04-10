import { UserRole } from '@prisma/client';
export declare class CreateUserDto {
    email: string;
    name: string;
    role: UserRole;
    schoolId?: string;
    branchId?: string;
}

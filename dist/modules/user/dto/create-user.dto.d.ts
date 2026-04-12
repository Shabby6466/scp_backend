import { UserRole } from '../../common/enums/database.enum';
export declare class CreateUserDto {
    email: string;
    name: string;
    role: UserRole;
    schoolId?: string;
    branchId?: string;
}

import { UserRole, StaffPosition } from '../../common/enums/database.enum';
export declare class SearchUserDto {
    query?: string;
    role?: UserRole;
    branchId?: string;
    staffPosition?: StaffPosition;
    staffClearanceActive?: boolean;
    schoolId?: string;
    page?: number;
    limit?: number;
}

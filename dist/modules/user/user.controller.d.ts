import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { UserRole } from '../common/enums/database.enum';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    listUsers(dto: SearchUserDto, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            lastPage: number;
        };
    }>;
    searchUsers(dto: SearchUserDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            lastPage: number;
        };
    }>;
    getUserDetail(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/user.entity").User>;
    findOneById(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/user.entity").User>;
    createUserGlobal(dto: CreateUserDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
        name?: string | null;
    }): Promise<import("../../entities/user.entity").User | null>;
    updateUser(id: string, dto: UpdateUserDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/user.entity").User | null>;
    createUser(schoolId: string, dto: CreateUserDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
        name?: string | null;
    }): Promise<import("../../entities/user.entity").User | null>;
    listBySchool(schoolId: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }, dto: SearchUserDto): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            lastPage: number;
        };
    }>;
    listBranchDirectorCandidates(schoolId: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/user.entity").User[]>;
    listTeachers(user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/user.entity").User[]>;
}

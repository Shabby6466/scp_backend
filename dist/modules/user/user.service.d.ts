import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { SettingsService } from '../settings/settings.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '../common/enums/database.enum';
import { SearchUserDto } from './dto/search-user.dto';
import { SchoolService } from '../school/school.service';
import { BranchService } from '../branch/branch.service';
export declare class UserService {
    private readonly userRepository;
    private readonly schoolService;
    private readonly branchService;
    private readonly auth;
    private readonly settings;
    constructor(userRepository: Repository<User>, schoolService: SchoolService, branchService: BranchService, auth: AuthService, settings: SettingsService);
    createUser(dto: CreateUserDto, currentUser: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
        name?: string | null;
    }): Promise<User | null>;
    getBranchForUser(branchId: string): Promise<import("../../entities/branch.entity").Branch>;
    listTeachersForSchoolDirector(currentUser: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<User[]>;
    findStudentsWithRequiredDocs(branchId: string): Promise<User[]>;
    findTeachersWithRequiredDocs(branchId: string): Promise<User[]>;
    countParentsInSchool(schoolId: string): Promise<number>;
    listBranchDirectorCandidates(schoolId: string, currentUser: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<User[]>;
    listBySchool(schoolId: string, currentUser: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }, dto?: SearchUserDto): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            lastPage: number;
        };
    }>;
    private searchDtoFilter;
    listAll(dto?: SearchUserDto): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            lastPage: number;
        };
    }>;
    listUsersForCaller(dto: SearchUserDto, user: {
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
    searchUsers(dto: SearchUserDto, currentUser: {
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
    private paginate;
    findOneById(targetId: string, actor: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<User>;
    getUserDetail(targetId: string, actor: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<User>;
    private isSuperiorOf;
    updateUser(targetId: string, dto: {
        name?: string;
        password?: string;
        schoolId?: string;
        branchId?: string;
    }, actor: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<User | null>;
    private assertBranchInSchool;
    private assertSuperiorCanPatchUser;
    private userBelongsToSchool;
    private userBelongsToBranchScope;
    private validateCreatePermission;
    private resolveScopeForCreate;
    findTeachersByBranchId(branchId: string): Promise<User[]>;
    findOneByEmailForAuth(email: string): Promise<User | null>;
    findOneByEmailInternal(email: string): Promise<User | null>;
    createSelfRegisteredUser(data: {
        email: string;
        name: string;
        passwordHash: string;
        role: UserRole;
        verified?: boolean;
    }): Promise<User>;
    markEmailVerified(userId: string, newPasswordHash?: string): Promise<void>;
    findOneByEmailWithRelations(email: string, relations: string[]): Promise<User | null>;
    findDirectorBySchool(schoolId: string): Promise<User | null>;
    findBranchDirectorByBranch(branchId: string): Promise<User | null>;
    findOneInternal(id: string): Promise<User | null>;
    findUsersByIds(ids: string[]): Promise<User[]>;
    findRequiredDocTypesForUser(userId: string): Promise<import("../../entities/document.entity").DocumentType[]>;
    countByRoles(scope: {
        schoolId?: string;
        branchId?: string;
    }): Promise<any>;
    findAtRiskStaff(scope: {
        schoolId?: string;
        branchId?: string;
    }, limit?: number): Promise<User[]>;
}

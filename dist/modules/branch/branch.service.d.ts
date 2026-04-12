import { Repository, DataSource } from 'typeorm';
import { Branch } from '../../entities/branch.entity';
import { User } from '../../entities/user.entity';
import { UserRole } from '../common/enums/database.enum';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UserService } from '../user/user.service';
export declare class BranchService {
    private readonly branchRepository;
    private readonly userService;
    private readonly dataSource;
    constructor(branchRepository: Repository<Branch>, userService: UserService, dataSource: DataSource);
    findBySchoolId(schoolId: string): Promise<Branch[]>;
    findOneById(id: string): Promise<Branch | null>;
    create(schoolId: string, dto: CreateBranchDto, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<Branch>;
    findAllBySchool(schoolId: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<Branch[]>;
    findOne(id: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<Branch>;
    listTeachers(id: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<User[]>;
    update(id: string, dto: UpdateBranchDto, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<Branch | null>;
    remove(id: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<Branch>;
    private syncBranchDirectorForBranch;
    private ensureCanAccessBranchRecord;
}

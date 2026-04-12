import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../common/enums/database.enum';
import { StudentParent } from '../../entities/student-parent.entity';
import { UserService } from '../user/user.service';
import type { RegisterChildDto } from './dto/register-child.dto';
type JwtUser = {
    id: string;
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
};
export declare class StudentParentService {
    private readonly studentParentRepository;
    private readonly userService;
    private readonly dataSource;
    constructor(studentParentRepository: Repository<StudentParent>, userService: UserService, dataSource: DataSource);
    private assertParentRecord;
    private loadStudentSideUser;
    isLinked(parentId: string, studentId: string): Promise<boolean>;
    private assertCanAccessParentView;
    private assertCanAccessStudentView;
    listForParent(parentId: string, user: JwtUser): Promise<{
        id: string;
        studentId: string;
        parentId: string;
        relation: string | null;
        isPrimary: boolean;
        createdAt: string;
        student: {
            id: string;
            name: string | null;
            email: string;
            role: UserRole;
            branchId: string | null;
            schoolId: string | null;
            branch: {
                id: string;
                name: string;
            } | null;
            school: {
                id: string;
                name: string;
            } | null;
            studentProfile: {
                firstName: string | null;
                lastName: string | null;
                dateOfBirth: string | null;
                gradeLevel: string | null;
            } | null;
        };
    }[]>;
    listForStudent(studentId: string, user: JwtUser): Promise<{
        id: string;
        studentId: string;
        parentId: string;
        relation: string | null;
        isPrimary: boolean;
        createdAt: string;
        parent: {
            id: string;
            name: string | null;
            email: string;
            phone: string | null;
            role: UserRole;
            schoolId: string | null;
        };
    }[]>;
    create(dto: {
        studentId: string;
        parentId: string;
        relation?: string;
        isPrimary?: boolean;
    }, user: JwtUser): Promise<StudentParent | null>;
    registerChild(dto: RegisterChildDto, user: JwtUser): Promise<{
        student: {
            id: string;
            name: string | null;
            email: string;
            role: UserRole;
            schoolId: string | null;
            branchId: string | null;
            studentProfile: {
                firstName: string | null;
                lastName: string | null;
                dateOfBirth: string | null;
                gradeLevel: string | null;
            };
        };
        link: {
            id: string;
            studentId: string;
            parentId: string;
        };
    }>;
    remove(linkId: string, user: JwtUser): Promise<{
        ok: boolean;
    }>;
}
export {};

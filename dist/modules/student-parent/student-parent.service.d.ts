import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/database.enum';
import { StudentParent } from '../../entities/student-parent.entity';
import { UserService } from '../user/user.service';
type JwtUser = {
    id: string;
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
};
export declare class StudentParentService {
    private readonly studentParentRepository;
    private readonly userService;
    constructor(studentParentRepository: Repository<StudentParent>, userService: UserService);
    private assertParentRecord;
    private loadStudentSideUser;
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
    remove(linkId: string, user: JwtUser): Promise<{
        ok: boolean;
    }>;
}
export {};

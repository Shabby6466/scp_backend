import { UserRole } from '../common/enums/database.enum';
import { StudentParentService } from './student-parent.service';
export declare class StudentParentController {
    private readonly studentParentService;
    constructor(studentParentService: StudentParentService);
    listForParent(parentId: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    listForStudent(studentId: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    create(body: {
        studentId: string;
        parentId: string;
        relation?: string;
        isPrimary?: boolean;
    }, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/student-parent.entity").StudentParent | null>;
    remove(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        ok: boolean;
    }>;
}

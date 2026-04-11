import { UserRole } from '@prisma/client';
import { StudentParentService } from './student-parent.service.js';
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
            school: {
                name: string;
                id: string;
            } | null;
            branch: {
                name: string;
                id: string;
            } | null;
            name: string | null;
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            schoolId: string | null;
            branchId: string | null;
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
            name: string | null;
            id: string;
            email: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.UserRole;
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
    }): Promise<{
        student: {
            name: string | null;
            id: string;
            email: string;
        };
        parent: {
            name: string | null;
            id: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        isPrimary: boolean;
        parentId: string;
        studentId: string;
        relation: string | null;
    }>;
    remove(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        ok: boolean;
    }>;
}

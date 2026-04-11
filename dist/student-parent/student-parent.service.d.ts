import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
type JwtUser = {
    id: string;
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
};
export declare class StudentParentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    listForStudent(studentId: string, user: JwtUser): Promise<{
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
    create(dto: {
        studentId: string;
        parentId: string;
        relation?: string;
        isPrimary?: boolean;
    }, user: JwtUser): Promise<{
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
    remove(linkId: string, user: JwtUser): Promise<{
        ok: boolean;
    }>;
}
export {};

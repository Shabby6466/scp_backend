import { BaseEntity } from './base.entity';
import { User } from './user.entity';
export declare class StudentParent extends BaseEntity {
    studentId: string;
    parentId: string;
    relation: string | null;
    isPrimary: boolean;
    student: User;
    parent: User;
}

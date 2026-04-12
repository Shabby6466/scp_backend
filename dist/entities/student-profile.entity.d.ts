import { BaseEntity } from './base.entity';
import { User } from './user.entity';
export declare class StudentProfile extends BaseEntity {
    userId: string;
    firstName: string | null;
    lastName: string | null;
    dateOfBirth: Date | null;
    gradeLevel: string | null;
    rollNumber: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    deletedBy: string | null;
    user: User;
}

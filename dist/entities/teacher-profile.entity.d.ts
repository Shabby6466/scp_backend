import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { TeacherPosition } from './teacher-position.entity';
import { EmploymentStatus } from '../modules/common/enums/database.enum';
export declare class TeacherProfile extends BaseEntity {
    userId: string;
    subjectArea: string | null;
    employeeCode: string | null;
    joiningDate: Date | null;
    phone: string | null;
    hireDate: Date | null;
    employmentStatus: EmploymentStatus;
    certificationType: string | null;
    certificationExpiry: Date | null;
    backgroundCheckDate: Date | null;
    backgroundCheckExpiry: Date | null;
    positionId: string | null;
    notes: string | null;
    user: User;
    position: TeacherPosition | null;
}

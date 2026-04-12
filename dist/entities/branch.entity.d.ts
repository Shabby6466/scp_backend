import { BaseEntity } from './base.entity';
import { School } from './school.entity';
import { User } from './user.entity';
export declare class Branch extends BaseEntity {
    name: string;
    schoolId: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    phone: string | null;
    email: string | null;
    minAge: number | null;
    maxAge: number | null;
    totalCapacity: number | null;
    isPrimary: boolean;
    isActive: boolean;
    notes: string | null;
    deletedBy: string | null;
    school: School;
    users: User[];
}

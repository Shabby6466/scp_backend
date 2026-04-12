import { BaseEntity } from './base.entity';
import { User } from './user.entity';
export declare class DirectorProfile extends BaseEntity {
    userId: string;
    officePhone: string | null;
    notes: string | null;
    user: User;
}

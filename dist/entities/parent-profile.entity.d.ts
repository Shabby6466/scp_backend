import { BaseEntity } from './base.entity';
import { User } from './user.entity';
export declare class ParentProfile extends BaseEntity {
    phone: string | null;
    address: string | null;
    notes: string | null;
    user: User;
}

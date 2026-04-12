import { BaseEntity } from './base.entity';
import { User } from './user.entity';
export declare class BranchDirectorProfile extends BaseEntity {
    userId: string;
    branchStartDate: Date | null;
    notes: string | null;
    user: User;
}

import { BaseEntity } from './base.entity';
import { School } from './school.entity';
export declare class InspectionType extends BaseEntity {
    schoolId: string;
    name: string;
    description: string | null;
    frequency: string | null;
    school: School;
}

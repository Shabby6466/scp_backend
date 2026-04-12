import { BaseEntity } from './base.entity';
import { School } from './school.entity';
import { User } from './user.entity';
import { InspectionType } from './inspection-type.entity';
export declare class ComplianceRequirement extends BaseEntity {
    schoolId: string;
    name: string;
    description: string | null;
    inspectionTypeId: string | null;
    ownerId: string | null;
    createdById: string | null;
    school: School;
    inspectionType: InspectionType | null;
    owner: User | null;
    createdBy: User | null;
}

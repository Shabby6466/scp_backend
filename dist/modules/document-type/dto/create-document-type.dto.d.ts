import { RenewalPeriod, UserRole } from '../../common/enums/database.enum';
export declare class CreateDocumentTypeDto {
    name: string;
    targetRole: UserRole;
    renewalPeriod?: RenewalPeriod;
    schoolId?: string;
    branchId?: string;
    complianceCategoryId?: string;
}

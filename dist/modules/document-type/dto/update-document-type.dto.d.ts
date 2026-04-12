import { RenewalPeriod, UserRole } from '../../common/enums/database.enum';
export declare class UpdateDocumentTypeDto {
    name?: string;
    renewalPeriod?: RenewalPeriod;
    isMandatory?: boolean;
    targetRole?: UserRole;
    complianceCategoryId?: string | null;
}

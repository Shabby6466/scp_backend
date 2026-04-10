import { RenewalPeriod, UserRole } from '@prisma/client';
export declare class UpdateDocumentTypeDto {
    name?: string;
    renewalPeriod?: RenewalPeriod;
    isMandatory?: boolean;
    targetRole?: UserRole;
    complianceCategoryId?: string | null;
}

import { RenewalPeriod, UserRole } from '@prisma/client';
export declare class CreateDocumentTypeDto {
    name: string;
    targetRole: UserRole;
    renewalPeriod?: RenewalPeriod;
    schoolId?: string;
    branchId?: string;
    complianceCategoryId?: string;
}

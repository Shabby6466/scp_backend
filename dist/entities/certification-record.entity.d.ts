import { BaseEntity } from './base.entity';
import { School } from './school.entity';
import { CertificationType } from './certification-type.entity';
export declare class CertificationRecord extends BaseEntity {
    schoolId: string;
    certificationTypeId: string;
    issueDate: Date | null;
    expiryDate: Date | null;
    referenceNumber: string | null;
    documentUrl: string | null;
    school: School;
    certificationType: CertificationType;
}

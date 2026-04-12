import { BaseEntity } from './base.entity';
import { School } from './school.entity';
import { CertificationRecord } from './certification-record.entity';
export declare class CertificationType extends BaseEntity {
    schoolId: string;
    name: string;
    description: string | null;
    defaultValidityMonths: number | null;
    school: School;
    certificationRecords: CertificationRecord[];
}

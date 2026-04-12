import { Repository } from 'typeorm';
import { CertificationRecord } from '../../entities/certification-record.entity';
export declare class CertificationRecordService {
    private readonly repository;
    constructor(repository: Repository<CertificationRecord>);
    findBySchool(schoolId: string): Promise<CertificationRecord[]>;
}

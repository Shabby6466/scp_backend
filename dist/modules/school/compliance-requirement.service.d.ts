import { Repository } from 'typeorm';
import { ComplianceRequirement } from '../../entities/compliance-requirement.entity';
export declare class ComplianceRequirementService {
    private readonly repository;
    constructor(repository: Repository<ComplianceRequirement>);
    findBySchool(schoolId: string): Promise<ComplianceRequirement[]>;
}

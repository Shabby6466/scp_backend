import { Repository } from 'typeorm';
import { InspectionType } from '../../entities/inspection-type.entity';
export declare class InspectionTypeService {
    private readonly repository;
    constructor(repository: Repository<InspectionType>);
    findBySchool(schoolId: string): Promise<InspectionType[]>;
    findOne(id: string): Promise<InspectionType | null>;
}

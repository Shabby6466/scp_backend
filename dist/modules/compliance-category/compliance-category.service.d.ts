import { Repository } from 'typeorm';
import { ComplianceCategory } from '../../entities/compliance-category.entity';
import { UserRole } from '../common/enums/database.enum';
import { CreateComplianceCategoryDto } from './dto/create-compliance-category.dto';
import { UpdateComplianceCategoryDto } from './dto/update-compliance-category.dto';
import { SchoolService } from '../school/school.service';
import { UserService } from '../user/user.service';
type CurrentUser = {
    id: string;
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
};
export declare class ComplianceCategoryService {
    private readonly categoryRepository;
    private readonly schoolService;
    private readonly userService;
    constructor(categoryRepository: Repository<ComplianceCategory>, schoolService: SchoolService, userService: UserService);
    create(dto: CreateComplianceCategoryDto, user: CurrentUser): Promise<ComplianceCategory>;
    update(id: string, dto: UpdateComplianceCategoryDto, user: CurrentUser): Promise<ComplianceCategory>;
    delete(id: string, user: CurrentUser): Promise<{
        deleted: boolean;
    }>;
    findAll(user: CurrentUser, schoolId?: string): Promise<ComplianceCategory[]>;
    findOne(id: string, user: CurrentUser): Promise<ComplianceCategory>;
    findOneInternal(id: string): Promise<ComplianceCategory | null>;
    findBySlug(slug: string, user: CurrentUser): Promise<ComplianceCategory>;
    getScore(id: string, user: CurrentUser): Promise<{
        categoryId: string;
        categoryName: string;
        categorySlug: string;
        totalSlots: number;
        satisfiedSlots: number;
        score: number;
        expiringSoon: number;
        expired: number;
        byRole: Record<string, {
            total: number;
            satisfied: number;
        }>;
    }>;
    private assertAccess;
}
export {};

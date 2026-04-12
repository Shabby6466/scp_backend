import { ComplianceCategoryService } from './compliance-category.service';
import { UserRole } from '../common/enums/database.enum';
import { CreateComplianceCategoryDto } from './dto/create-compliance-category.dto';
import { UpdateComplianceCategoryDto } from './dto/update-compliance-category.dto';
export declare class ComplianceCategoryController {
    private readonly complianceCategoryService;
    constructor(complianceCategoryService: ComplianceCategoryService);
    create(user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }, dto: CreateComplianceCategoryDto): Promise<import("../../entities/compliance-category.entity").ComplianceCategory>;
    findAll(user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }, schoolId?: string): Promise<import("../../entities/compliance-category.entity").ComplianceCategory[]>;
    findBySlug(slug: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/compliance-category.entity").ComplianceCategory>;
    findOne(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/compliance-category.entity").ComplianceCategory>;
    getScore(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
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
    update(id: string, dto: UpdateComplianceCategoryDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/compliance-category.entity").ComplianceCategory>;
    delete(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        deleted: boolean;
    }>;
}

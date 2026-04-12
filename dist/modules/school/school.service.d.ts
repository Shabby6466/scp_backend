import { Repository, DataSource } from 'typeorm';
import { School } from '../../entities/school.entity';
import { User } from '../../entities/user.entity';
import { UserRole } from '../common/enums/database.enum';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { BranchDashboardService } from '../branch/branch-dashboard.service';
import { UserService } from '../user/user.service';
import { BranchService } from '../branch/branch.service';
import { InspectionTypeService } from './inspection-type.service';
import { ComplianceRequirementService } from './compliance-requirement.service';
import { CertificationRecordService } from './certification-record.service';
type DashboardUser = {
    id: string;
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
};
export declare class SchoolService {
    private readonly schoolRepository;
    private readonly userService;
    private readonly branchService;
    private readonly inspectionTypeService;
    private readonly complianceRequirementService;
    private readonly certificationRecordService;
    private readonly branchDashboardService;
    private readonly dataSource;
    constructor(schoolRepository: Repository<School>, userService: UserService, branchService: BranchService, inspectionTypeService: InspectionTypeService, complianceRequirementService: ComplianceRequirementService, certificationRecordService: CertificationRecordService, branchDashboardService: BranchDashboardService, dataSource: DataSource);
    create(dto: CreateSchoolDto): Promise<{
        _count: {
            users: number;
            branches: number;
        };
        name?: string | undefined;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        address?: string | null | undefined;
        city?: string | null | undefined;
        state?: string | null | undefined;
        zipCode?: string | null | undefined;
        website?: string | null | undefined;
        licenseNumber?: string | null | undefined;
        certificationNumber?: string | null | undefined;
        minAge?: number | null | undefined;
        maxAge?: number | null | undefined;
        totalCapacity?: number | null | undefined;
        primaryColor?: string | null | undefined;
        logoUrl?: string | null | undefined;
        isApproved?: boolean | undefined;
        approvedAt?: Date | null | undefined;
        approvedBy?: string | null | undefined;
        deletedBy?: string | null | undefined;
        users?: User[] | undefined;
        branches?: import("../../entities/branch.entity").Branch[] | undefined;
        complianceRequirements?: import("../../entities/compliance-requirement.entity").ComplianceRequirement[] | undefined;
        inspectionTypes?: import("../../entities/inspection-type.entity").InspectionType[] | undefined;
        certificationTypes?: import("../../entities/certification-type.entity").CertificationType[] | undefined;
        teacherPositions?: import("../../entities/teacher-position.entity").TeacherPosition[] | undefined;
        eligibilityProfiles?: import("../../entities/teacher-eligibility-profile.entity").TeacherEligibilityProfile[] | undefined;
        id?: string | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        deletedAt?: Date | null;
    }>;
    findAll(user: {
        role: UserRole;
        schoolId: string | null;
    }): Promise<{
        _count: {
            users: number;
            branches: number;
        };
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        website: string | null;
        licenseNumber: string | null;
        certificationNumber: string | null;
        minAge: number | null;
        maxAge: number | null;
        totalCapacity: number | null;
        primaryColor: string | null;
        logoUrl: string | null;
        isApproved: boolean;
        approvedAt: Date | null;
        approvedBy: string | null;
        deletedBy: string | null;
        users: User[];
        branches: import("../../entities/branch.entity").Branch[];
        complianceRequirements: import("../../entities/compliance-requirement.entity").ComplianceRequirement[];
        inspectionTypes: import("../../entities/inspection-type.entity").InspectionType[];
        certificationTypes: import("../../entities/certification-type.entity").CertificationType[];
        teacherPositions: import("../../entities/teacher-position.entity").TeacherPosition[];
        eligibilityProfiles: import("../../entities/teacher-eligibility-profile.entity").TeacherEligibilityProfile[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt?: Date | null;
    }[]>;
    findOne(id: string, user: {
        role: UserRole;
        schoolId: string | null;
    }): Promise<{
        users: {
            id: string;
            email: string;
            name: string | null;
            role: UserRole;
            createdAt: Date;
        }[];
        _count: {
            users: number;
            branches: number;
        };
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        website: string | null;
        licenseNumber: string | null;
        certificationNumber: string | null;
        minAge: number | null;
        maxAge: number | null;
        totalCapacity: number | null;
        primaryColor: string | null;
        logoUrl: string | null;
        isApproved: boolean;
        approvedAt: Date | null;
        approvedBy: string | null;
        deletedBy: string | null;
        branches: import("../../entities/branch.entity").Branch[];
        complianceRequirements: import("../../entities/compliance-requirement.entity").ComplianceRequirement[];
        inspectionTypes: import("../../entities/inspection-type.entity").InspectionType[];
        certificationTypes: import("../../entities/certification-type.entity").CertificationType[];
        teacherPositions: import("../../entities/teacher-position.entity").TeacherPosition[];
        eligibilityProfiles: import("../../entities/teacher-eligibility-profile.entity").TeacherEligibilityProfile[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt?: Date | null;
    }>;
    findOneInternal(id: string): Promise<School>;
    update(id: string, dto: UpdateSchoolDto, user?: {
        role: UserRole;
        schoolId: string | null;
    }): Promise<School>;
    remove(id: string): Promise<School>;
    getDashboardSummary(id: string, user: DashboardUser): Promise<{
        name: string;
        stats: {
            pendingDocs: number;
            expiringDocs: number;
            studentCount: number;
            teacherCount: number;
            parentCount: number;
        };
    }>;
    listComplianceRequirements(id: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/compliance-requirement.entity").ComplianceRequirement[]>;
    listInspectionTypes(id: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/inspection-type.entity").InspectionType[]>;
    listCertificationRecords(id: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<import("../../entities/certification-record.entity").CertificationRecord[]>;
}
export {};

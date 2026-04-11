import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { SearchUserDto } from './dto/search-user.dto.js';
import { UserRole } from '@prisma/client';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    listUsers(dto: SearchUserDto, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            lastPage: number;
        };
    }>;
    searchUsers(dto: SearchUserDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            lastPage: number;
        };
    }>;
    getUserDetail(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        school: {
            name: string;
            id: string;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            deletedAt: Date | null;
            deletedBy: string | null;
            createdAt: Date;
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
        } | null;
        branch: {
            name: string;
            id: string;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            schoolId: string;
            deletedAt: Date | null;
            deletedBy: string | null;
            createdAt: Date;
            address: string | null;
            city: string | null;
            state: string | null;
            zipCode: string | null;
            minAge: number | null;
            maxAge: number | null;
            totalCapacity: number | null;
            isPrimary: boolean;
            isActive: boolean;
            notes: string | null;
        } | null;
        directorProfile: {
            updatedAt: Date;
            createdAt: Date;
            notes: string | null;
            userId: string;
            officePhone: string | null;
        } | null;
        branchDirectorProfile: {
            updatedAt: Date;
            createdAt: Date;
            notes: string | null;
            userId: string;
            branchStartDate: Date | null;
        } | null;
        teacherProfile: {
            certificationType: string | null;
            updatedAt: Date;
            phone: string | null;
            createdAt: Date;
            notes: string | null;
            userId: string;
            subjectArea: string | null;
            employeeCode: string | null;
            joiningDate: Date | null;
            hireDate: Date | null;
            employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
            certificationExpiry: Date | null;
            backgroundCheckDate: Date | null;
            backgroundCheckExpiry: Date | null;
            positionId: string | null;
        } | null;
        studentProfile: {
            updatedAt: Date;
            deletedAt: Date | null;
            deletedBy: string | null;
            createdAt: Date;
            userId: string;
            firstName: string | null;
            lastName: string | null;
            dateOfBirth: Date | null;
            gradeLevel: string | null;
            rollNumber: string | null;
            guardianName: string | null;
            guardianPhone: string | null;
        } | null;
        ownerDocuments: ({
            documentType: {
                name: string;
                id: string;
                updatedAt: Date;
                schoolId: string | null;
                branchId: string | null;
                createdAt: Date;
                isActive: boolean;
                targetRole: import("@prisma/client").$Enums.UserRole;
                category: string | null;
                description: string | null;
                isMandatory: boolean;
                renewalPeriod: import("@prisma/client").$Enums.RenewalPeriod;
                sortOrder: number;
                appliesToAgeMin: number | null;
                appliesToAgeMax: number | null;
                complianceCategoryId: string | null;
                createdById: string;
            };
            uploadedBy: {
                name: string | null;
                id: string;
                email: string;
            };
        } & {
            id: string;
            deletedAt: Date | null;
            deletedBy: string | null;
            createdAt: Date;
            notes: string | null;
            expiresAt: Date | null;
            ownerUserId: string;
            documentTypeId: string;
            uploadedById: string;
            s3Key: string;
            fileName: string;
            mimeType: string;
            sizeBytes: number;
            status: import("@prisma/client").$Enums.DocumentStatus;
            issuedAt: Date | null;
            verifiedAt: Date | null;
            reviewedAt: Date | null;
            reviewedById: string | null;
            rejectionReason: string | null;
        })[];
        requiredDocTypes: {
            name: string;
            id: string;
            updatedAt: Date;
            schoolId: string | null;
            branchId: string | null;
            createdAt: Date;
            isActive: boolean;
            targetRole: import("@prisma/client").$Enums.UserRole;
            category: string | null;
            description: string | null;
            isMandatory: boolean;
            renewalPeriod: import("@prisma/client").$Enums.RenewalPeriod;
            sortOrder: number;
            appliesToAgeMin: number | null;
            appliesToAgeMax: number | null;
            complianceCategoryId: string | null;
            createdById: string;
        }[];
    } & {
        name: string | null;
        id: string;
        updatedAt: Date;
        email: string;
        password: string | null;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        authorities: import("@prisma/client").$Enums.UserRole[];
        schoolId: string | null;
        branchId: string | null;
        assignedById: string | null;
        staffPosition: import("@prisma/client").$Enums.StaffPosition | null;
        staffClearanceActive: boolean;
        emailVerifiedAt: Date | null;
        deletedAt: Date | null;
        deletedBy: string | null;
        createdAt: Date;
    }>;
    findOneById(id: string, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        school: {
            name: string;
            id: string;
        } | null;
        branch: {
            name: string;
            id: string;
            schoolId: string;
        } | null;
        name: string | null;
        id: string;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        schoolId: string | null;
        branchId: string | null;
        staffPosition: import("@prisma/client").$Enums.StaffPosition | null;
        staffClearanceActive: boolean;
        createdAt: Date;
    }>;
    createUserGlobal(dto: CreateUserDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
        name?: string | null;
    }): Promise<{
        school: {
            name: string;
            id: string;
        } | null;
        branch: {
            name: string;
            id: string;
        } | null;
        name: string | null;
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        schoolId: string | null;
        branchId: string | null;
        createdAt: Date;
    }>;
    updateUser(id: string, dto: UpdateUserDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        school: {
            name: string;
            id: string;
        } | null;
        branch: {
            name: string;
            id: string;
            schoolId: string;
        } | null;
        name: string | null;
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        schoolId: string | null;
        branchId: string | null;
        staffPosition: import("@prisma/client").$Enums.StaffPosition | null;
        staffClearanceActive: boolean;
        createdAt: Date;
    }>;
    createUser(schoolId: string, dto: CreateUserDto, user: {
        id: string;
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
        name?: string | null;
    }): Promise<{
        school: {
            name: string;
            id: string;
        } | null;
        branch: {
            name: string;
            id: string;
        } | null;
        name: string | null;
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        schoolId: string | null;
        branchId: string | null;
        createdAt: Date;
    }>;
    listBySchool(schoolId: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }, dto: SearchUserDto): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            lastPage: number;
        };
    }>;
    listBranchDirectorCandidates(schoolId: string, user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        school: {
            name: string;
            id: string;
        } | null;
        branch: {
            name: string;
            id: string;
            schoolId: string;
        } | null;
        name: string | null;
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        schoolId: string | null;
        branchId: string | null;
        createdAt: Date;
    }[]>;
    listTeachers(user: {
        role: UserRole;
        schoolId: string | null;
        branchId: string | null;
    }): Promise<{
        branch: {
            name: string;
            id: string;
            schoolId: string;
        } | null;
        name: string | null;
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        schoolId: string | null;
        branchId: string | null;
        staffPosition: import("@prisma/client").$Enums.StaffPosition | null;
        staffClearanceActive: boolean;
        createdAt: Date;
    }[]>;
}

import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSchoolDto } from './dto/create-school.dto.js';
import { UpdateSchoolDto } from './dto/update-school.dto.js';
export declare class SchoolService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateSchoolDto): Promise<{
        _count: {
            users: number;
            branches: number;
        };
    } & {
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
    }>;
    findAll(user: {
        role: UserRole;
        schoolId: string | null;
    }): Promise<({
        _count: {
            users: number;
            branches: number;
        };
    } & {
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
    })[]>;
    findOne(id: string, user: {
        role: UserRole;
        schoolId: string | null;
    }): Promise<{
        _count: {
            users: number;
            branches: number;
        };
        users: {
            name: string | null;
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            createdAt: Date;
        }[];
    } & {
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
    }>;
    update(id: string, dto: UpdateSchoolDto, user?: {
        role: UserRole;
        schoolId: string | null;
    }): Promise<{
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
    }>;
    remove(id: string): Promise<{
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
    }>;
}

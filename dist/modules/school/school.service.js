"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const school_entity_1 = require("../../entities/school.entity");
const user_entity_1 = require("../../entities/user.entity");
const database_enum_1 = require("../common/enums/database.enum");
const branch_dashboard_service_1 = require("../branch/branch-dashboard.service");
const user_service_1 = require("../user/user.service");
const branch_service_1 = require("../branch/branch.service");
const inspection_type_service_1 = require("./inspection-type.service");
const compliance_requirement_service_1 = require("./compliance-requirement.service");
const certification_record_service_1 = require("./certification-record.service");
let SchoolService = class SchoolService {
    constructor(schoolRepository, userService, branchService, inspectionTypeService, complianceRequirementService, certificationRecordService, branchDashboardService, dataSource) {
        this.schoolRepository = schoolRepository;
        this.userService = userService;
        this.branchService = branchService;
        this.inspectionTypeService = inspectionTypeService;
        this.complianceRequirementService = complianceRequirementService;
        this.certificationRecordService = certificationRecordService;
        this.branchDashboardService = branchDashboardService;
        this.dataSource = dataSource;
    }
    async create(dto) {
        return this.dataSource.transaction(async (manager) => {
            let school = manager.create(school_entity_1.School, { name: dto.name.trim() });
            school = await manager.save(school_entity_1.School, school);
            const directorId = dto.directorUserId?.trim();
            if (directorId) {
                const director = await manager.findOne(user_entity_1.User, {
                    where: { id: directorId },
                });
                if (!director) {
                    throw new common_1.NotFoundException('Director user not found');
                }
                if (director.role === database_enum_1.UserRole.ADMIN) {
                    throw new common_1.BadRequestException('A platform admin cannot be assigned as a school director');
                }
                if (director.role !== database_enum_1.UserRole.DIRECTOR) {
                    throw new common_1.BadRequestException('Selected user must have the director role');
                }
                director.schoolId = school.id;
                director.branchId = null;
                director.staffPosition = null;
                director.staffClearanceActive = false;
                await manager.save(user_entity_1.User, director);
            }
            const result = await manager.findOne(school_entity_1.School, {
                where: { id: school.id },
                relations: ['users', 'branches'],
            });
            return {
                ...result,
                _count: {
                    users: result?.users?.length || 0,
                    branches: result?.branches?.length || 0,
                },
            };
        });
    }
    async findAll(user) {
        if (user.role === database_enum_1.UserRole.DIRECTOR && !user.schoolId) {
            return [];
        }
        const query = this.schoolRepository.createQueryBuilder('school')
            .leftJoinAndSelect('school.users', 'user')
            .leftJoinAndSelect('school.branches', 'branch')
            .orderBy('school.name', 'ASC');
        if (user.role === database_enum_1.UserRole.DIRECTOR || user.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
            if (user.schoolId) {
                query.where('school.id = :id', { id: user.schoolId });
            }
            else {
                return [];
            }
        }
        const schools = await query.getMany();
        return schools.map(s => ({
            ...s,
            _count: {
                users: s.users?.length || 0,
                branches: s.branches?.length || 0,
            }
        }));
    }
    async findOne(id, user) {
        if (user.role === database_enum_1.UserRole.DIRECTOR || user.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
            if (!user.schoolId || user.schoolId !== id) {
                throw new common_1.ForbiddenException('Cannot access this school');
            }
        }
        const school = await this.schoolRepository.findOne({
            where: { id },
            relations: ['users', 'branches'],
        });
        if (!school) {
            throw new common_1.NotFoundException('School not found');
        }
        return {
            ...school,
            users: school.users?.map(u => ({
                id: u.id,
                email: u.email,
                name: u.name,
                role: u.role,
                createdAt: u.createdAt,
            })),
            _count: {
                users: school.users?.length || 0,
                branches: school.branches?.length || 0,
            },
        };
    }
    async findOneInternal(id) {
        const school = await this.schoolRepository.findOne({ where: { id } });
        if (!school) {
            throw new common_1.NotFoundException('School not found');
        }
        return school;
    }
    async update(id, dto, user) {
        if (user?.role === database_enum_1.UserRole.DIRECTOR) {
            if (!user.schoolId || user.schoolId !== id) {
                throw new common_1.ForbiddenException('Cannot update this school');
            }
        }
        const school = await this.schoolRepository.findOne({ where: { id } });
        if (!school)
            throw new common_1.NotFoundException('School not found');
        if (dto.name != null)
            school.name = dto.name.trim();
        return this.schoolRepository.save(school);
    }
    async remove(id) {
        const school = await this.schoolRepository.findOne({ where: { id } });
        if (!school)
            throw new common_1.NotFoundException('School not found');
        return this.schoolRepository.remove(school);
    }
    async getDashboardSummary(id, user) {
        await this.findOne(id, user);
        const school = await this.schoolRepository.findOne({
            where: { id },
            select: { name: true },
        });
        if (!school) {
            throw new common_1.NotFoundException('School not found');
        }
        const branches = await this.branchService.findBySchoolId(id);
        let studentCount = 0;
        let teacherCount = 0;
        let pendingDocs = 0;
        let expiringDocs = 0;
        for (const b of branches) {
            const summary = await this.branchDashboardService.getDashboardSummary(b.id, user);
            studentCount += summary.studentCount;
            teacherCount += summary.teacherCount;
            pendingDocs += summary.compliance.missingSlots;
            expiringDocs += summary.formsNearExpiryCount;
        }
        const parentCount = await this.userService.countParentsInSchool(id);
        return {
            name: school.name,
            stats: {
                pendingDocs,
                expiringDocs,
                studentCount,
                teacherCount,
                parentCount,
            },
        };
    }
    async listComplianceRequirements(id, user) {
        await this.findOne(id, user);
        return this.complianceRequirementService.findBySchool(id);
    }
    async listInspectionTypes(id, user) {
        await this.findOne(id, user);
        return this.inspectionTypeService.findBySchool(id);
    }
    async listCertificationRecords(id, user) {
        await this.findOne(id, user);
        return this.certificationRecordService.findBySchool(id);
    }
};
exports.SchoolService = SchoolService;
exports.SchoolService = SchoolService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(school_entity_1.School)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_service_1.UserService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => branch_service_1.BranchService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        user_service_1.UserService,
        branch_service_1.BranchService,
        inspection_type_service_1.InspectionTypeService,
        compliance_requirement_service_1.ComplianceRequirementService,
        certification_record_service_1.CertificationRecordService,
        branch_dashboard_service_1.BranchDashboardService,
        typeorm_2.DataSource])
], SchoolService);
//# sourceMappingURL=school.service.js.map
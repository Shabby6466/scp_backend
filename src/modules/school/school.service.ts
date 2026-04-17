import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ComplianceCategoryService } from '../compliance-category/compliance-category.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, DataSource } from 'typeorm';
import { School } from '../../entities/school.entity';
import { User } from '../../entities/user.entity';
import { Branch } from '../../entities/branch.entity';
import { UserRole } from '../common/enums/database.enum';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { BranchDashboardService } from '../branch/branch-dashboard.service';
import { UserService } from '../user/user.service';
import { BranchService } from '../branch/branch.service';
import { InspectionTypeService } from './inspection-type.service';
import { ComplianceRequirementService } from './compliance-requirement.service';
import { CertificationRecordService } from './certification-record.service';
import { StudentProfileService } from '../student-parent/student-profile.service';

type DashboardUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => BranchService))
    private readonly branchService: BranchService,
    private readonly inspectionTypeService: InspectionTypeService,
    private readonly complianceRequirementService: ComplianceRequirementService,
    private readonly certificationRecordService: CertificationRecordService,
    private readonly branchDashboardService: BranchDashboardService,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => StudentProfileService))
    private readonly studentProfileService: StudentProfileService,
    @Inject(forwardRef(() => ComplianceCategoryService))
    private readonly complianceCategoryService: ComplianceCategoryService,
  ) { }

  async create(dto: CreateSchoolDto, actorUserId: string) {
    const created = await this.dataSource.transaction(async (manager) => {
      const isApproved = dto.isApproved ?? dto.is_approved ?? false;
      const approvedAtRaw = dto.approvedAt ?? dto.approved_at ?? null;
      const approvedAt = approvedAtRaw ? new Date(approvedAtRaw) : null;

      let school = manager.create(School, {
        name: dto.name.trim(),
        email: dto.email?.trim() || null,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        city: dto.city?.trim() || null,
        state: dto.state?.trim() || null,
        zipCode: (dto.zipCode ?? dto.zip_code)?.trim() || null,
        isApproved,
        approvedAt:
          approvedAt && !Number.isNaN(approvedAt.getTime()) ? approvedAt : null,
        approvedBy: isApproved ? 'admin' : null,
      });
      school = await manager.save(School, school);

      const directorId = dto.directorUserId?.trim();
      if (directorId) {
        const director = await manager.findOne(User, {
          where: { id: directorId },
        });

        if (!director) {
          throw new NotFoundException('Director user not found');
        }

        if (director.role === UserRole.ADMIN) {
          throw new BadRequestException(
            'A platform admin cannot be assigned as a school director',
          );
        }

        if (director.role !== UserRole.DIRECTOR) {
          throw new BadRequestException(
            'Selected user must have the director role',
          );
        }

        director.schoolId = school.id;
        director.branchId = null;
        director.staffPosition = null;
        director.staffClearanceActive = false;
        await manager.save(User, director);
      }

      const result = await manager.findOne(School, {
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

    const schoolId = (created as School).id;
    await this.complianceCategoryService.ensureDefaultCategoriesForSchool(
      schoolId,
      actorUserId,
    );
    return created;
  }

  async findAll(user: { role: UserRole; schoolId: string | null }) {
    if (user.role === UserRole.DIRECTOR && !user.schoolId) {
      return [];
    }

    const query = this.schoolRepository.createQueryBuilder('school')
      .leftJoinAndSelect('school.users', 'user')
      .leftJoinAndSelect('school.branches', 'branch')
      .orderBy('school.name', 'ASC');

    if (user.role === UserRole.DIRECTOR || user.role === UserRole.BRANCH_DIRECTOR) {
      if (user.schoolId) {
        query.where('school.id = :id', { id: user.schoolId });
      } else {
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

  async findOne(id: string, user: { role: UserRole; schoolId: string | null }) {
    if (user.role === UserRole.DIRECTOR || user.role === UserRole.BRANCH_DIRECTOR) {
      if (!user.schoolId || user.schoolId !== id) {
        throw new ForbiddenException('Cannot access this school');
      }
    }

    const school = await this.schoolRepository.findOne({
      where: { id },
      relations: ['users', 'branches'],
    });

    if (!school) {
      throw new NotFoundException('School not found');
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

  async findOneInternal(id: string) {
    const school = await this.schoolRepository.findOne({ where: { id } });
    if (!school) {
      throw new NotFoundException('School not found');
    }
    return school;
  }

  async update(
    id: string,
    dto: UpdateSchoolDto,
    user?: { role: UserRole; schoolId: string | null },
  ) {
    if (user?.role === UserRole.DIRECTOR) {
      if (!user.schoolId || user.schoolId !== id) {
        throw new ForbiddenException('Cannot update this school');
      }
    }

    const school = await this.schoolRepository.findOne({ where: { id } });
    if (!school) throw new NotFoundException('School not found');

    const str = (v: string | null | undefined) =>
      v === undefined
        ? undefined
        : v === null || v === ''
          ? null
          : String(v).trim();

    if (dto.name !== undefined && dto.name != null) {
      school.name = dto.name.trim();
    }
    if (dto.email !== undefined) {
      const t = str(dto.email);
      school.email = t === undefined ? school.email : t;
    }
    if (dto.phone !== undefined) {
      const t = str(dto.phone);
      school.phone = t === undefined ? school.phone : t;
    }
    if (dto.address !== undefined) {
      const t = str(dto.address);
      school.address = t === undefined ? school.address : t;
    }
    if (dto.city !== undefined) {
      const t = str(dto.city);
      school.city = t === undefined ? school.city : t;
    }
    if (dto.state !== undefined) {
      const t = str(dto.state);
      school.state = t === undefined ? school.state : t;
    }
    const zipIn = dto.zipCode ?? dto.zip_code;
    if (zipIn !== undefined) {
      const t = str(zipIn);
      school.zipCode = t === undefined ? school.zipCode : t;
    }
    if (dto.website !== undefined) {
      const t = str(dto.website);
      school.website = t === undefined ? school.website : t;
    }

    const minAge = dto.minAge ?? dto.min_age;
    if (minAge !== undefined) {
      school.minAge = minAge === null ? null : minAge;
    }
    const maxAge = dto.maxAge ?? dto.max_age;
    if (maxAge !== undefined) {
      school.maxAge = maxAge === null ? null : maxAge;
    }
    const cap = dto.totalCapacity ?? dto.total_capacity;
    if (cap !== undefined) {
      school.totalCapacity = cap === null ? null : cap;
    }

    const lic = dto.licenseNumber ?? dto.license_number;
    if (lic !== undefined) {
      const t = str(lic);
      school.licenseNumber = t === undefined ? school.licenseNumber : t;
    }
    const cert = dto.certificationNumber ?? dto.certification_number;
    if (cert !== undefined) {
      const t = str(cert);
      school.certificationNumber = t === undefined ? school.certificationNumber : t;
    }

    const pc = dto.primaryColor ?? dto.primary_color;
    if (pc !== undefined) {
      const t = str(pc);
      school.primaryColor = t === undefined ? school.primaryColor : t;
    }
    const logo = dto.logoUrl ?? dto.logo_url;
    if (logo !== undefined) {
      const t = str(logo);
      school.logoUrl = t === undefined ? school.logoUrl : t;
    }

    const approvedFlag = dto.isApproved ?? dto.is_approved;
    if (approvedFlag !== undefined) {
      school.isApproved = approvedFlag;
    }

    const approvedAtRaw = dto.approvedAt ?? dto.approved_at;
    if (approvedAtRaw !== undefined) {
      if (approvedAtRaw === null || approvedAtRaw === '') {
        school.approvedAt = null;
      } else {
        const d = new Date(approvedAtRaw);
        school.approvedAt = Number.isNaN(d.getTime()) ? null : d;
      }
    }

    if (dto.approvedBy !== undefined) {
      const t = str(dto.approvedBy);
      school.approvedBy = t === undefined ? school.approvedBy : t;
    }

    return this.schoolRepository.save(school);
  }

  async remove(id: string) {
    const school = await this.schoolRepository.findOne({ where: { id } });
    if (!school) throw new NotFoundException('School not found');
    return this.schoolRepository.remove(school);
  }

  async listStudentProfiles(
    schoolId: string,
    user: {
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    if (user.role === UserRole.TEACHER) {
      if (!user.schoolId || user.schoolId !== schoolId) {
        throw new ForbiddenException('Cannot access this school');
      }
      const rows = await this.studentProfileService.findBySchoolId(schoolId);
      if (user.branchId) {
        return rows.filter((r) => r.branchId === user.branchId);
      }
      return rows;
    }

    await this.findOne(schoolId, user);
    return this.studentProfileService.findBySchoolId(schoolId);
  }

  async getDashboardSummary(id: string, user: DashboardUser) {
    await this.findOne(id, user);

    const school = await this.schoolRepository.findOne({
      where: { id },
      select: { name: true },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const branches = await this.branchService.findBySchoolId(id);

    let studentCount = 0;
    let teacherCount = 0;
    let pendingDocs = 0;
    let expiringDocs = 0;

    for (const b of branches) {
      const summary = await this.branchDashboardService.getDashboardSummary(
        b.id,
        user,
      );
      studentCount += summary.studentCount;
      teacherCount += summary.teacherCount;
      pendingDocs += summary.compliance.missingSlots;
      expiringDocs += summary.formsNearExpiryCount;
    }

    const parentCount = await this.userService.countParentsInSchool(id);

    const userRepo = this.dataSource.getRepository(User);
    const branchCount = branches.length;
    const directorCount = await userRepo.count({
      where: { schoolId: id, role: UserRole.DIRECTOR },
    });
    const branchDirectorCount = await userRepo
      .createQueryBuilder('u')
      .where('u.role = :role', { role: UserRole.BRANCH_DIRECTOR })
      .andWhere(
        new Brackets((w) => {
          w.where('u.school_id = :sid', { sid: id }).orWhere(
            'EXISTS (SELECT 1 FROM "Branch" b WHERE b.id = u.branch_id AND b.school_id = :sid)',
            { sid: id },
          );
        }),
      )
      .getCount();

    return {
      name: school.name,
      stats: {
        pendingDocs,
        expiringDocs,
        studentCount,
        teacherCount,
        parentCount,
        branchCount,
        directorCount,
        branchDirectorCount,
      },
    };
  }

  /** Platform-wide counts for admin sidebar badges. */
  async getPlatformNavigationCounts() {
    const userRepo = this.dataSource.getRepository(User);
    const branchRepo = this.dataSource.getRepository(Branch);

    const [
      schoolCount,
      branchCount,
      studentCount,
      teacherCount,
      parentCount,
      directorCount,
      branchDirectorCount,
    ] = await Promise.all([
      this.schoolRepository.count(),
      branchRepo.count(),
      this.studentProfileService.countInScope({}),
      userRepo.count({ where: { role: UserRole.TEACHER } }),
      userRepo.count({ where: { role: UserRole.PARENT } }),
      userRepo.count({ where: { role: UserRole.DIRECTOR } }),
      userRepo.count({ where: { role: UserRole.BRANCH_DIRECTOR } }),
    ]);

    return {
      schoolCount,
      branchCount,
      studentCount,
      teacherCount,
      parentCount,
      directorCount,
      branchDirectorCount,
    };
  }

  async listComplianceRequirements(
    id: string,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    await this.findOne(id, user);
    return this.complianceRequirementService.findBySchool(id);
  }

  async listInspectionTypes(
    id: string,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    await this.findOne(id, user);
    return this.inspectionTypeService.findBySchool(id);
  }

  async listCertificationRecords(
    id: string,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    await this.findOne(id, user);
    return this.certificationRecordService.findBySchool(id);
  }

  async approve(id: string) {
    const school = await this.schoolRepository.findOne({ where: { id } });
    if (!school) {
      throw new NotFoundException('School not found');
    }
    school.isApproved = true;
    school.approvedAt = new Date();
    school.approvedBy = 'admin';
    return this.schoolRepository.save(school);
  }

  async createInspectionType(schoolId: string, body: any, actorUserId?: string) {
    return this.inspectionTypeService.create(schoolId, body, actorUserId);
  }

  async updateInspectionType(id: string, body: any, actorUserId?: string) {
    return this.inspectionTypeService.update(id, body, actorUserId);
  }

  async removeInspectionType(id: string) {
    return this.inspectionTypeService.remove(id);
  }

  async createComplianceRequirement(schoolId: string, body: any) {
    return this.complianceRequirementService.create(schoolId, body);
  }

  async updateComplianceRequirement(id: string, body: any) {
    return this.complianceRequirementService.update(id, body);
  }

  async removeComplianceRequirement(id: string) {
    return this.complianceRequirementService.remove(id);
  }

  async createCertificationRecord(schoolId: string, body: any) {
    return this.certificationRecordService.create(schoolId, body);
  }

  async updateCertificationRecord(id: string, body: any) {
    return this.certificationRecordService.update(id, body);
  }

  async removeCertificationRecord(id: string) {
    return this.certificationRecordService.remove(id);
  }
}

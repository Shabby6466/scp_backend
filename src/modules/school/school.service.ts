import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
  ) { }

  async create(dto: CreateSchoolDto) {
    return this.dataSource.transaction(async (manager) => {
      let school = manager.create(School, { name: dto.name.trim() });
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

    if (dto.name != null) school.name = dto.name.trim();

    return this.schoolRepository.save(school);
  }

  async remove(id: string) {
    const school = await this.schoolRepository.findOne({ where: { id } });
    if (!school) throw new NotFoundException('School not found');
    return this.schoolRepository.remove(school);
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
}

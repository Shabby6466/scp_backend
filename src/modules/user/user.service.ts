import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { TeacherProfile } from '../../entities/teacher-profile.entity';
import { AuthService } from '../auth/auth.service';
import { SettingsService } from '../settings/settings.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmploymentStatus, UserRole } from '../common/enums/database.enum';
import {
  canManageSchoolBranches,
  isSchoolDirector,
} from '../auth/school-scope.util';
import { SearchUserDto } from './dto/search-user.dto';
import { SchoolService } from '../school/school.service';
import { BranchService } from '../branch/branch.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TeacherProfile)
    private readonly teacherProfileRepository: Repository<TeacherProfile>,
    @Inject(forwardRef(() => SchoolService))
    private readonly schoolService: SchoolService,
    @Inject(forwardRef(() => BranchService))
    private readonly branchService: BranchService,
    @Inject(forwardRef(() => AuthService))
    private readonly auth: AuthService,
    private readonly settings: SettingsService,
  ) { }

  async createUser(
    dto: CreateUserDto,
    currentUser: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
      name?: string | null;
    },
  ) {
    this.validateCreatePermission(dto, currentUser);

    if (dto.role === UserRole.STUDENT) {
      throw new BadRequestException(
        'Students are not login users. Add enrollments via parent registration, invitations, or student profiles.',
      );
    }

    const email = dto.email.toLowerCase().trim();
    const existing = await this.userRepository.findOne({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const displayName = this.resolveDisplayNameForCreate(dto);

    const { schoolId, branchId } = await this.resolveScopeForCreate(
      dto,
      currentUser,
    );
    if (
      currentUser.role !== UserRole.ADMIN &&
      dto.role !== UserRole.ADMIN &&
      !schoolId &&
      !branchId
    ) {
      throw new ForbiddenException('School or branch is required');
    }

    if (dto.role === UserRole.DIRECTOR) {
      if (currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException(
          'Only a platform admin can assign a school director',
        );
      }
      if (schoolId) {
        const taken = await this.userRepository.findOne({
          where: { role: UserRole.DIRECTOR, schoolId },
        });
        if (taken) {
          throw new ConflictException('This school already has a director');
        }
      }
    }

    if (dto.role === UserRole.BRANCH_DIRECTOR) {
      if (
        currentUser.role !== UserRole.ADMIN &&
        !isSchoolDirector(currentUser)
      ) {
        throw new ForbiddenException(
          'Only a platform admin or school director can assign a branch director',
        );
      }
      if (branchId && schoolId) {
        await this.assertBranchInSchool(branchId, schoolId);
      }
      if (!branchId && !schoolId && currentUser.role !== UserRole.ADMIN) {
        throw new BadRequestException(
          'schoolId is required for a pool branch director (no branch yet)',
        );
      }
      if (
        isSchoolDirector(currentUser) &&
        schoolId &&
        currentUser.schoolId &&
        schoolId !== currentUser.schoolId
      ) {
        throw new ForbiddenException(
          'Branch director must belong to your school',
        );
      }
    }

    if (
      (isSchoolDirector(currentUser) ||
        currentUser.role === UserRole.DIRECTOR) &&
      branchId &&
      dto.role === UserRole.TEACHER
    ) {
      await this.assertBranchInSchool(branchId, currentUser.schoolId!);
    }

    if (
      currentUser.role === UserRole.BRANCH_DIRECTOR &&
      dto.role === UserRole.TEACHER
    ) {
      if (!branchId || branchId !== currentUser.branchId) {
        throw new ForbiddenException(
          'Teachers must be created for your branch only',
        );
      }
    }

    let resolvedSchoolId: string | null = schoolId;
    let resolvedBranchId: string | null = branchId;
    if (
      (dto.role === UserRole.TEACHER || dto.role === UserRole.PARENT) &&
      branchId
    ) {
      const b = await this.branchService.findOneById(branchId);
      if (!b) {
        throw new NotFoundException('Branch not found');
      }
      resolvedSchoolId = b.schoolId;
      resolvedBranchId = branchId;
    } else if (
      (dto.role === UserRole.TEACHER || dto.role === UserRole.PARENT) &&
      schoolId
    ) {
      resolvedSchoolId = schoolId;
      resolvedBranchId = branchId ?? null;
    }

    const { otpEmailVerificationEnabled } = await this.settings.getPublic();
    const passwordInput = dto.password?.trim();
    const manualPasswordHash =
      passwordInput && passwordInput.length > 0
        ? await bcrypt.hash(passwordInput, 12)
        : undefined;
    const skipInviteEmail =
      dto.role !== UserRole.ADMIN &&
      (!otpEmailVerificationEnabled || !!manualPasswordHash);

    const user = this.userRepository.create({
      email,
      name: displayName,
      phone: dto.phone?.trim() ? dto.phone.trim() : null,
      ...(manualPasswordHash ? { password: manualPasswordHash } : {}),
      role: dto.role,
      schoolId:
        dto.role === UserRole.DIRECTOR ||
          dto.role === UserRole.BRANCH_DIRECTOR
          ? (schoolId ?? null)
          : dto.role === UserRole.TEACHER || dto.role === UserRole.PARENT
            ? resolvedSchoolId
            : null,
      branchId:
        dto.role === UserRole.TEACHER ||
          dto.role === UserRole.BRANCH_DIRECTOR ||
          dto.role === UserRole.PARENT
          ? resolvedBranchId
          : null,
      staffPosition: null,
      staffClearanceActive: false,
      ...(skipInviteEmail ? { emailVerifiedAt: new Date() } : {}),
    });

    await this.userRepository.save(user);

    if (dto.role === UserRole.TEACHER) {
      await this.applyTeacherProfileFromCreateDto(user.id, dto);
    }

    const result = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['school', 'branch'],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        branchId: true,
        createdAt: true,
        school: { id: true, name: true },
        branch: { id: true, name: true },
      },
    });

    if (
      dto.role !== UserRole.ADMIN &&
      otpEmailVerificationEnabled &&
      !manualPasswordHash
    ) {
      await this.auth.sendInviteOtp(email, currentUser.name ?? undefined);
    }

    return result;
  }

  async getBranchForUser(branchId: string) {
    const branch = await this.branchService.findOneById(branchId);
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  async listTeachersForSchoolDirector(currentUser: {
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
  }) {
    if (isSchoolDirector(currentUser)) {
      return this.userRepository.find({
        where: {
          role: UserRole.TEACHER,
          branch: { schoolId: currentUser.schoolId! },
        },
        order: { email: 'ASC' },
        relations: ['branch'],
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          schoolId: true,
          branchId: true,
          createdAt: true,
          staffPosition: true,
          staffClearanceActive: true,
          branch: { id: true, name: true, schoolId: true },
        },
      });
    }
    if (currentUser.role === UserRole.BRANCH_DIRECTOR && currentUser.branchId) {
      return this.userRepository.find({
        where: {
          role: UserRole.TEACHER,
          branchId: currentUser.branchId,
        },
        order: { email: 'ASC' },
        relations: ['branch'],
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          schoolId: true,
          branchId: true,
          createdAt: true,
          staffPosition: true,
          staffClearanceActive: true,
          branch: { id: true, name: true, schoolId: true },
        },
      });
    }
    throw new ForbiddenException(
      'Only a school director or branch director can list teachers this way',
    );
  }

  async findTeachersWithRequiredDocs(branchId: string) {
    return this.userRepository.find({
      where: { role: UserRole.TEACHER, branchId },
      relations: ['requiredDocTypes'],
    });
  }

  async countParentsInSchool(schoolId: string) {
    return this.userRepository.count({
      where: {
        schoolId,
        role: UserRole.PARENT,
      },
    });
  }

  async listBranchDirectorCandidates(
    schoolId: string,
    currentUser: {
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    if (!canManageSchoolBranches(currentUser, schoolId)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const school = await this.schoolService.findOneInternal(schoolId);
    if (!school) {
      throw new NotFoundException('School not found');
    }

    return this.userRepository.find({
      where: [
        { role: UserRole.BRANCH_DIRECTOR, schoolId },
        { role: UserRole.BRANCH_DIRECTOR, branch: { schoolId } },
        { role: UserRole.BRANCH_DIRECTOR, schoolId: IsNull(), branchId: IsNull() },
      ],
      order: { email: 'ASC' },
      relations: ['branch', 'school'],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        branchId: true,
        createdAt: true,
        branch: { id: true, name: true, schoolId: true },
        school: { id: true, name: true },
      },
    });
  }

  async listBySchool(
    schoolId: string,
    currentUser: {
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
    dto: SearchUserDto = {},
  ) {
    if (currentUser.role === UserRole.ADMIN) {
      // ok
    } else if (currentUser.role === UserRole.DIRECTOR) {
      if (currentUser.schoolId !== schoolId) {
        throw new ForbiddenException('Cannot access this school');
      }
    } else if (currentUser.role === UserRole.BRANCH_DIRECTOR) {
      if (currentUser.schoolId !== schoolId || !currentUser.branchId) {
        throw new ForbiddenException('Cannot access this school');
      }
    } else if (currentUser.branchId) {
      const branch = await this.branchService.findOneById(currentUser.branchId);
      if (!branch || branch.schoolId !== schoolId) {
        throw new ForbiddenException('Cannot access this school');
      }
    } else {
      throw new ForbiddenException('Cannot access this school');
    }

    const school = await this.schoolService.findOneInternal(schoolId);

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const where: any = {
      schoolId,
    };

    if (currentUser.role === UserRole.BRANCH_DIRECTOR && currentUser.branchId) {
      where.branchId = currentUser.branchId;
    }

    // Apply extra filters from DTO
    Object.assign(where, this.searchDtoFilter(dto));

    return this.paginate(this.userRepository, {
      where,
      order: { role: 'DESC', email: 'ASC' },
      relations: ['branch', 'teacherProfile'],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        branchId: true,
        phone: true,
        createdAt: true,
        staffPosition: true,
        staffClearanceActive: true,
        branch: { id: true, name: true, schoolId: true },
        teacherProfile: {
          hireDate: true,
          employmentStatus: true,
          certificationType: true,
          certificationExpiry: true,
          backgroundCheckDate: true,
          backgroundCheckExpiry: true,
          notes: true,
          phone: true,
        },
      },
    }, dto);
  }

  private searchDtoFilter(dto: SearchUserDto): any {
    const filter: any = {};

    if (dto.query?.trim()) {
      // TypeORM doesn't support complex OR with mode: 'insensitive' as easily as Prisma
      // for now we'll use simple field checks or ILike if possible
      // But for this refactor we'll keep it simple
    }

    if (dto.role) {
      filter.role = dto.role;
    }

    if (dto.schoolId) {
      filter.schoolId = dto.schoolId;
    }

    if (dto.branchId) {
      filter.branchId = dto.branchId;
    }

    if (dto.staffPosition) {
      filter.staffPosition = dto.staffPosition;
    }

    if (dto.staffClearanceActive !== undefined) {
      filter.staffClearanceActive = dto.staffClearanceActive;
    }

    return filter;
  }

  async listAll(dto: SearchUserDto = {}) {
    const where = this.searchDtoFilter(dto);

    return this.paginate(
      this.userRepository,
      {
        where,
        order: { role: 'DESC', email: 'ASC' },
        relations: ['school', 'branch', 'teacherProfile'],
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          schoolId: true,
          branchId: true,
          createdAt: true,
          staffPosition: true,
          staffClearanceActive: true,
          school: { id: true, name: true },
          branch: { id: true, name: true, schoolId: true },
          teacherProfile: {
            hireDate: true,
            employmentStatus: true,
            certificationType: true,
            certificationExpiry: true,
            backgroundCheckDate: true,
            backgroundCheckExpiry: true,
            notes: true,
            phone: true,
          },
        },
      },
      dto,
    );
  }

  async listUsersForCaller(
    dto: SearchUserDto,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.listAll(dto);
    }
    if (user.role !== UserRole.DIRECTOR && user.role !== UserRole.BRANCH_DIRECTOR) {
      throw new ForbiddenException('Insufficient permissions to list users');
    }
    if (!user.schoolId) {
      throw new ForbiddenException('Account has no school scope');
    }
    if (dto.schoolId && dto.schoolId !== user.schoolId) {
      throw new ForbiddenException('Cannot list users for another school');
    }
    return this.listBySchool(user.schoolId, user, dto);
  }

  async searchUsers(
    dto: SearchUserDto,
    currentUser: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    const where: any = this.searchDtoFilter(dto);

    if (currentUser.role !== UserRole.ADMIN) {
      if (isSchoolDirector(currentUser)) {
        where.schoolId = currentUser.schoolId!;
      } else if (currentUser.role === UserRole.BRANCH_DIRECTOR) {
        where.branchId = currentUser.branchId!;
      } else {
        where.id = currentUser.id;
      }
    }

    return this.paginate(this.userRepository, {
      where,
      order: { role: 'DESC', name: 'ASC' },
      relations: ['school', 'branch'],
    }, dto);
  }

  private async paginate(
    repository: Repository<any>,
    options: any,
    params: { page?: number; limit?: number },
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await repository.findAndCount({
      ...options,
      take: limit,
      skip,
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOneById(
    targetId: string,
    actor: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    const user = await this.userRepository.findOne({
      where: { id: targetId },
      relations: ['branch', 'school'],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        branchId: true,
        phone: true,
        staffPosition: true,
        staffClearanceActive: true,
        createdAt: true,
        branch: { id: true, name: true, schoolId: true },
        school: { id: true, name: true },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (actor.role !== UserRole.ADMIN && actor.id !== targetId) {
      const isSuperior = await this.isSuperiorOf(actor, {
        id: user.id,
        role: user.role,
        schoolId: user.schoolId,
        branchId: user.branchId,
      });
      if (!isSuperior) {
        throw new ForbiddenException('Cannot access this user');
      }
    }

    return user;
  }

  async getUserDetail(
    targetId: string,
    actor: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    const user = await this.userRepository.findOne({
      where: { id: targetId },
      relations: [
        'school',
        'branch',
        'directorProfile',
        'branchDirectorProfile',
        'teacherProfile',
        'parentProfile',
        'documents',
        'requiredDocTypes',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Permission check
    if (actor.role !== UserRole.ADMIN && actor.id !== targetId) {
      const isSuperior = await this.isSuperiorOf(actor, user);
      if (!isSuperior) {
        throw new ForbiddenException('Cannot access this user details');
      }
    }

    return user;
  }

  private async isSuperiorOf(
    actor: {
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
    target: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ): Promise<boolean> {
    if (actor.role === UserRole.ADMIN) return true;

    if (isSchoolDirector(actor)) {
      if (!actor.schoolId) return false;
      return this.userBelongsToSchool(target.id, actor.schoolId);
    }

    if (actor.role === UserRole.BRANCH_DIRECTOR) {
      if (!actor.branchId) return false;
      return this.userBelongsToBranchScope(target.id, actor.branchId);
    }

    return false;
  }

  async updateUser(
    targetId: string,
    dto: UpdateUserDto,
    actor: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    const rawSchool = dto.schoolId ?? dto.school_id;
    const rawBranch = dto.branchId ?? dto.branch_id;
    const schoolPatchRaw =
      rawSchool === undefined ? undefined : this.normalizeUuidField(rawSchool);
    const branchPatchRaw =
      rawBranch === undefined ? undefined : this.normalizeUuidField(rawBranch);

    const adminScopePatch =
      actor.role === UserRole.ADMIN &&
      (schoolPatchRaw !== undefined ||
        branchPatchRaw !== undefined ||
        dto.role !== undefined);

    const hasTeacherPatch =
      dto.hire_date !== undefined ||
      dto.certification_type !== undefined ||
      dto.certification_expiry !== undefined ||
      dto.background_check_date !== undefined ||
      dto.background_check_expiry !== undefined ||
      dto.employment_status !== undefined ||
      dto.notes !== undefined;

    const hasContactPatch =
      dto.email !== undefined || dto.phone !== undefined;

    const derivedName =
      dto.first_name !== undefined || dto.last_name !== undefined
        ? [dto.first_name, dto.last_name]
            .map((x) => (x == null ? '' : String(x).trim()))
            .filter(Boolean)
            .join(' ')
            .trim()
        : '';

    const nameOut =
      dto.name !== undefined ? dto.name.trim() : derivedName || undefined;

    if (
      nameOut === undefined &&
      (dto.password === undefined || dto.password === '') &&
      !adminScopePatch &&
      !hasContactPatch &&
      !hasTeacherPatch
    ) {
      throw new BadRequestException(
        'Provide at least one field to update (name, password, email, phone, assignment, role, or teacher profile fields)',
      );
    }

    const target = await this.userRepository.findOne({
      where: { id: targetId },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.role === UserRole.ADMIN && adminScopePatch) {
      throw new BadRequestException(
        'Cannot assign school, branch, or role to a platform admin',
      );
    }

    const isSelf = actor.id === target.id;
    if (isSelf && actor.role !== UserRole.ADMIN) {
      if (
        schoolPatchRaw !== undefined ||
        branchPatchRaw !== undefined ||
        dto.role !== undefined ||
        hasTeacherPatch
      ) {
        throw new ForbiddenException(
          'You can only update profile fields (name, email, phone, password) on your own account',
        );
      }
    } else if (!isSelf) {
      await this.assertSuperiorCanPatchUser(actor, target);
    }

    const data: {
      name?: string;
      password?: string;
      schoolId?: string | null;
      branchId?: string | null;
      email?: string;
      phone?: string | null;
      role?: UserRole;
    } = {};

    if (nameOut !== undefined && nameOut.length > 0) {
      data.name = nameOut;
    }
    if (dto.password !== undefined && dto.password.length > 0) {
      data.password = await bcrypt.hash(dto.password, 12);
    }

    if (dto.email !== undefined) {
      const raw = dto.email;
      if (raw === null || raw === '') {
        throw new BadRequestException('Email cannot be empty');
      }
      const em = raw.toLowerCase().trim();
      if (em !== target.email) {
        const taken = await this.userRepository.findOne({ where: { email: em } });
        if (taken && taken.id !== target.id) {
          throw new ConflictException('Email already in use');
        }
      }
      data.email = em;
    }

    if (dto.phone !== undefined) {
      const p = dto.phone;
      data.phone =
        p === null || String(p).trim() === '' ? null : String(p).trim();
    }

    if (actor.role === UserRole.ADMIN && schoolPatchRaw !== undefined) {
      const sid =
        schoolPatchRaw === null || schoolPatchRaw === ''
          ? ''
          : String(schoolPatchRaw).trim();
      if (target.role === UserRole.DIRECTOR) {
        if (sid) {
          const taken = await this.userRepository.findOne({
            where: {
              role: UserRole.DIRECTOR,
              schoolId: sid,
              id: Not(target.id),
            },
          });
          if (taken) {
            throw new ConflictException('This school already has a director');
          }
        }
        data.schoolId = sid || null;
        data.branchId = null;
      } else if (target.role === UserRole.BRANCH_DIRECTOR) {
        data.schoolId = sid || null;
        if (!sid) {
          data.branchId = null;
        }
      } else if (target.role === UserRole.TEACHER) {
        data.schoolId = sid || null;
      }
    }

    if (actor.role === UserRole.ADMIN && branchPatchRaw !== undefined) {
      const bid =
        branchPatchRaw === null || branchPatchRaw === ''
          ? ''
          : String(branchPatchRaw).trim();
      if (target.role === UserRole.TEACHER) {
        if (bid) {
          const b = await this.branchService.findOneById(bid);
          if (!b) {
            throw new NotFoundException('Branch not found');
          }
          data.branchId = bid;
          data.schoolId = b.schoolId;
        } else {
          data.branchId = null;
        }
      } else if (target.role === UserRole.BRANCH_DIRECTOR && bid) {
        const b = await this.branchService.findOneById(bid);
        if (!b) {
          throw new NotFoundException('Branch not found');
        }
        data.branchId = bid;
        data.schoolId = b.schoolId;
      }
    }

    const newRole = this.parseOptionalRole(dto.role);
    if (actor.role === UserRole.ADMIN && newRole !== undefined && newRole !== target.role) {
      if (target.role === UserRole.ADMIN) {
        throw new BadRequestException('Cannot change platform admin role');
      }
      if (newRole === UserRole.DIRECTOR) {
        const sid =
          (data.schoolId as string | null | undefined) ??
          (schoolPatchRaw !== undefined
            ? schoolPatchRaw === null || schoolPatchRaw === ''
              ? null
              : String(schoolPatchRaw).trim()
            : target.schoolId);
        if (!sid) {
          throw new BadRequestException('schoolId is required when assigning director');
        }
        const taken = await this.userRepository.findOne({
          where: {
            role: UserRole.DIRECTOR,
            schoolId: sid,
            id: Not(target.id),
          },
        });
        if (taken) {
          throw new ConflictException('This school already has a director');
        }
        data.role = newRole;
        data.schoolId = sid;
        data.branchId = null;
      } else {
        data.role = newRole;
      }
    }

    await this.userRepository.update(targetId, data);

    if (hasTeacherPatch && target.role === UserRole.TEACHER) {
      await this.applyTeacherProfileFromUpdateDto(targetId, dto);
    }

    return this.userRepository.findOne({
      where: { id: targetId },
      relations: ['school', 'branch'],
    });
  }

  private async applyTeacherProfileFromUpdateDto(
    userId: string,
    dto: UpdateUserDto,
  ) {
    let profile = await this.teacherProfileRepository.findOne({
      where: { userId },
    });
    if (!profile) {
      profile = this.teacherProfileRepository.create({ userId });
    }
    const hire = this.parseOptionalDate(dto.hire_date);
    if (hire !== undefined) profile.hireDate = hire;
    if (dto.certification_type !== undefined) {
      profile.certificationType =
        dto.certification_type === null || dto.certification_type === ''
          ? null
          : String(dto.certification_type).trim();
    }
    const certExp = this.parseOptionalDate(dto.certification_expiry);
    if (certExp !== undefined) profile.certificationExpiry = certExp;
    const bg = this.parseOptionalDate(dto.background_check_date);
    if (bg !== undefined) profile.backgroundCheckDate = bg;
    const bgx = this.parseOptionalDate(dto.background_check_expiry);
    if (bgx !== undefined) profile.backgroundCheckExpiry = bgx;
    if (dto.notes !== undefined) {
      profile.notes =
        dto.notes === null ? null : String(dto.notes);
    }
    const es = this.parseEmploymentStatus(dto.employment_status);
    if (es !== undefined) profile.employmentStatus = es;
    await this.teacherProfileRepository.save(profile);
  }

  private async assertBranchInSchool(branchId: string, schoolId: string) {
    const branch = await this.branchService.findOneById(branchId);
    if (!branch || branch.schoolId !== schoolId) {
      throw new ForbiddenException('Branch is not in your school');
    }
  }

  private async assertSuperiorCanPatchUser(
    actor: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
    target: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    if (actor.role === UserRole.ADMIN) {
      return;
    }

    if (target.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only a platform admin can edit this account',
      );
    }

    if (actor.role === UserRole.DIRECTOR) {
      if (!actor.schoolId) {
        throw new ForbiddenException('Your account is not linked to a school');
      }
      if (target.role === UserRole.DIRECTOR) {
        throw new ForbiddenException(
          'Only a platform admin can edit the school director',
        );
      }
      const ok = await this.userBelongsToSchool(target.id, actor.schoolId);
      if (!ok) {
        throw new ForbiddenException('User is not in your school');
      }
      return;
    }

    if (actor.role === UserRole.BRANCH_DIRECTOR) {
      if (!actor.branchId || !actor.schoolId) {
        throw new ForbiddenException('Your account is not linked to a branch');
      }
      if (
        target.role === UserRole.DIRECTOR ||
        target.role === UserRole.BRANCH_DIRECTOR
      ) {
        throw new ForbiddenException('You cannot edit this account');
      }
      const ok = await this.userBelongsToBranchScope(target.id, actor.branchId);
      if (!ok) {
        throw new ForbiddenException('User is not at your branch');
      }
      return;
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  private async userBelongsToSchool(
    userId: string,
    schoolId: string,
  ): Promise<boolean> {
    const u = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['branch'],
    });
    if (!u) {
      return false;
    }
    if (u.schoolId === schoolId) {
      return true;
    }
    if (u.branch?.schoolId === schoolId) {
      return true;
    }
    return false;
  }

  private async userBelongsToBranchScope(
    userId: string,
    branchId: string,
  ): Promise<boolean> {
    const u = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!u) return false;
    if (u.role === UserRole.TEACHER || u.role === UserRole.BRANCH_DIRECTOR) {
      return u.branchId === branchId;
    }
    return false;
  }

  private validateCreatePermission(
    dto: CreateUserDto,
    currentUser: {
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }
    if (currentUser.role === UserRole.DIRECTOR) {
      if (!currentUser.schoolId) {
        throw new ForbiddenException('Your account is not linked to a school');
      }
      if (
        dto.role !== UserRole.TEACHER &&
        dto.role !== UserRole.BRANCH_DIRECTOR &&
        dto.role !== UserRole.PARENT
      ) {
        throw new ForbiddenException(
          'You can only create teachers, branch directors, or parents for your school',
        );
      }
      return;
    }
    if (currentUser.role === UserRole.BRANCH_DIRECTOR) {
      if (dto.role !== UserRole.TEACHER && dto.role !== UserRole.PARENT) {
        throw new ForbiddenException(
          'You can only create teachers or parents for your branch',
        );
      }
      return;
    }
    throw new ForbiddenException('Insufficient permissions');
  }

  /**
   * UI often sends placeholders instead of null/omit (e.g. Select value "_none_").
   * Never pass those to Postgres uuid columns or TypeORM findOneById.
   */
  private normalizeUuidField(
    raw: string | null | undefined,
  ): string | null | undefined {
    if (raw === undefined) return undefined;
    if (raw === null) return null;
    const t = String(raw).trim();
    if (!t) return null;
    const lower = t.toLowerCase();
    if (
      lower === '_none_' ||
      lower === 'none' ||
      lower === '_null_' ||
      lower === 'null' ||
      lower === 'undefined'
    ) {
      return null;
    }
    return t;
  }

  private pickSchoolId(dto: CreateUserDto): string | null {
    const merged = dto.schoolId ?? dto.school_id;
    const n = this.normalizeUuidField(merged);
    return n ?? null;
  }

  private pickBranchId(dto: CreateUserDto): string | null {
    const merged = dto.branchId ?? dto.branch_id;
    const n = this.normalizeUuidField(merged);
    return n ?? null;
  }

  private resolveDisplayNameForCreate(dto: CreateUserDto): string {
    const fromSplit = [dto.first_name, dto.last_name]
      .filter((x) => x != null && String(x).trim() !== '')
      .map((x) => String(x).trim())
      .join(' ')
      .trim();
    const fromName = dto.name?.trim() ?? '';
    const out = fromName.length > 0 ? fromName : fromSplit;
    if (!out) {
      throw new BadRequestException(
        'Name is required (use name or first_name and last_name)',
      );
    }
    return out;
  }

  private parseOptionalDate(
    raw: string | null | undefined,
  ): Date | null | undefined {
    if (raw === undefined) return undefined;
    if (raw === null || String(raw).trim() === '') return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private parseEmploymentStatus(
    raw: string | null | undefined,
  ): EmploymentStatus | undefined {
    if (raw === undefined) return undefined;
    if (raw === null || String(raw).trim() === '') return undefined;
    const k = String(raw).trim().toUpperCase().replace(/-/g, '_');
    const allowed = Object.values(EmploymentStatus) as string[];
    if (allowed.includes(k)) return k as EmploymentStatus;
    return undefined;
  }

  private async applyTeacherProfileFromCreateDto(
    userId: string,
    dto: CreateUserDto,
  ) {
    let profile = await this.teacherProfileRepository.findOne({
      where: { userId },
    });
    if (!profile) {
      profile = this.teacherProfileRepository.create({ userId });
    }
    if (dto.phone?.trim()) {
      profile.phone = dto.phone.trim();
    }
    const hire = this.parseOptionalDate(dto.hire_date);
    if (hire !== undefined) profile.hireDate = hire;
    if (dto.certification_type !== undefined) {
      profile.certificationType =
        dto.certification_type === null || dto.certification_type === ''
          ? null
          : String(dto.certification_type).trim();
    }
    const certExp = this.parseOptionalDate(dto.certification_expiry);
    if (certExp !== undefined) profile.certificationExpiry = certExp;
    const es = this.parseEmploymentStatus(dto.employment_status);
    if (es !== undefined) profile.employmentStatus = es;
    await this.teacherProfileRepository.save(profile);
  }

  private parseOptionalRole(
    role: string | null | undefined,
  ): UserRole | undefined {
    if (role === undefined) return undefined;
    if (role === null) return undefined;
    const s = String(role).trim();
    if (!s) return undefined;
    const key = s.toUpperCase().replace(/-/g, '_');
    const all = Object.values(UserRole) as string[];
    if (all.includes(key)) return key as UserRole;
    throw new BadRequestException(`Invalid role: ${role}`);
  }

  private async resolveScopeForCreate(
    dto: CreateUserDto,
    currentUser: {
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ): Promise<{ schoolId: string | null; branchId: string | null }> {
    const sId = this.pickSchoolId(dto);
    const bId = this.pickBranchId(dto);

    if (dto.role === UserRole.ADMIN) {
      return { schoolId: null, branchId: null };
    }
    if (currentUser.role === UserRole.ADMIN) {
      if (dto.role === UserRole.DIRECTOR) {
        return { schoolId: sId, branchId: null };
      }
      if (dto.role === UserRole.BRANCH_DIRECTOR) {
        if (bId) {
          const b = await this.branchService.findOneById(bId);
          if (!b) {
            throw new NotFoundException('Branch not found');
          }
          return { schoolId: b.schoolId, branchId: bId };
        }
        return { schoolId: sId, branchId: null };
      }
      if (dto.role === UserRole.TEACHER) {
        return { schoolId: sId, branchId: bId };
      }
      if (dto.role === UserRole.PARENT) {
        return { schoolId: sId, branchId: bId };
      }
      return { schoolId: null, branchId: null };
    }
    if (currentUser.role === UserRole.DIRECTOR) {
      if (!currentUser.schoolId) {
        throw new ForbiddenException('Your account is not linked to a school');
      }
      if (dto.role === UserRole.BRANCH_DIRECTOR) {
        if (bId) {
          return { schoolId: currentUser.schoolId, branchId: bId };
        }
        return { schoolId: currentUser.schoolId, branchId: null };
      }
      if (dto.role === UserRole.PARENT) {
        return { schoolId: currentUser.schoolId, branchId: bId };
      }
      return { schoolId: null, branchId: bId };
    }
    if (currentUser.role === UserRole.BRANCH_DIRECTOR) {
      if (!currentUser.branchId || !currentUser.schoolId) {
        throw new ForbiddenException('Your account is not linked to a branch');
      }
      return { schoolId: currentUser.schoolId, branchId: currentUser.branchId };
    }
    throw new ForbiddenException('Insufficient permissions');
  }

  async findTeachersByBranchId(branchId: string) {
    return this.userRepository.find({
      where: {
        role: UserRole.TEACHER,
        branchId,
      },
      order: { email: 'ASC' },
      relations: ['branch'],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        branchId: true,
        createdAt: true,
        staffPosition: true,
        staffClearanceActive: true,
        branch: { id: true, name: true, schoolId: true },
      },
    });
  }

  async findOneByEmailForAuth(email: string) {
    return this.userRepository.findOne({
      where: { email },
      relations: ['school', 'branch'],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        branchId: true,
        password: true,
        emailVerifiedAt: true,
        school: { id: true, name: true },
        branch: { id: true, name: true, schoolId: true },
      },
    });
  }

  async findOneByEmailInternal(email: string) {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async createSelfRegisteredUser(data: {
    email: string;
    name: string;
    passwordHash: string;
    role: UserRole;
    verified?: boolean;
  }) {
    const user = this.userRepository.create({
      email: data.email,
      name: data.name,
      password: data.passwordHash,
      role: data.role,
      emailVerifiedAt: data.verified ? new Date() : null,
    });
    return this.userRepository.save(user);
  }

  async markEmailVerified(userId: string, newPasswordHash?: string) {
    const data: any = {
      emailVerifiedAt: new Date(),
    };
    if (newPasswordHash) {
      data.password = newPasswordHash;
    }
    await this.userRepository.update(userId, data);
  }

  async setPassword(userId: string, passwordHash: string) {
    await this.userRepository.update(userId, { password: passwordHash });
  }

  async findOneByEmailWithRelations(email: string, relations: string[]) {
    return this.userRepository.findOne({
      where: { email },
      relations,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        branchId: true,
        school: { id: true, name: true },
        branch: { id: true, name: true, schoolId: true },
      },
    });
  }

  async findDirectorBySchool(schoolId: string) {
    return this.userRepository.findOne({
      where: { role: UserRole.DIRECTOR, schoolId },
      select: { id: true, name: true, email: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findBranchDirectorByBranch(branchId: string) {
    return this.userRepository.findOne({
      where: { role: UserRole.BRANCH_DIRECTOR, branchId },
      select: { id: true, name: true, email: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOneInternal(id: string) {
    return this.userRepository.findOne({ where: { id } });
  }

  async findUsersByIds(ids: string[]) {
    return this.userRepository.find({ where: { id: In(ids) } });
  }

  async findRequiredDocTypesForUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['requiredDocTypes'],
    });
    return user?.requiredDocTypes || [];
  }

  async countByRoles(scope: { schoolId?: string; branchId?: string }) {
    const qb = this.userRepository.createQueryBuilder('u')
      .select('u.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('u.role');

    if (scope.branchId) {
      qb.where('u.branchId = :branchId', { branchId: scope.branchId });
    } else if (scope.schoolId) {
      qb.innerJoin('u.branch', 'b').where('b.schoolId = :schoolId', { schoolId: scope.schoolId });
    }

    const stats = await qb.getRawMany();
    return stats.reduce(
      (acc, s) => ({ ...acc, [s.role]: parseInt(s.count) }),
      {} as Record<UserRole, number>,
    );
  }

  async findAtRiskStaff(scope: { schoolId?: string; branchId?: string }, limit = 5) {
    const aqb = this.userRepository.createQueryBuilder('u')
      .where('u.role IN (:...roles)', { roles: [UserRole.TEACHER] })
      .leftJoin('u.ownerDocuments', 'd', 'd.verifiedAt IS NOT NULL')
      .take(limit);

    if (scope.branchId) {
      aqb.andWhere('u.branchId = :branchId', { branchId: scope.branchId });
    } else if (scope.schoolId) {
      aqb.innerJoin('u.branch', 'b').andWhere('b.schoolId = :schoolId', { schoolId: scope.schoolId });
    }

    aqb.andWhere('d.id IS NULL');
    return aqb.getMany();
  }

  async remove(targetId: string, actorId: string) {
    const user = await this.userRepository.findOne({ where: { id: targetId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.deletedBy = actorId;
    await this.userRepository.save(user);

    return this.userRepository.softDelete(targetId);
  }
}

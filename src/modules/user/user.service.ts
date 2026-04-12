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
import { AuthService } from '../auth/auth.service';
import { SettingsService } from '../settings/settings.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '../common/enums/database.enum';
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

    const email = dto.email.toLowerCase().trim();
    const existing = await this.userRepository.findOne({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

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
      (dto.role === UserRole.TEACHER || dto.role === UserRole.STUDENT)
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

    if (
      currentUser.role === UserRole.BRANCH_DIRECTOR &&
      dto.role === UserRole.STUDENT
    ) {
      if (!branchId || branchId !== currentUser.branchId) {
        throw new ForbiddenException(
          'Students must be created for your branch only',
        );
      }
    }

    let resolvedSchoolId: string | null = schoolId;
    let resolvedBranchId: string | null = branchId;
    if (
      (dto.role === UserRole.TEACHER || dto.role === UserRole.STUDENT) &&
      branchId
    ) {
      const b = await this.branchService.findOneById(branchId);
      if (!b) {
        throw new NotFoundException('Branch not found');
      }
      resolvedSchoolId = b.schoolId;
      resolvedBranchId = branchId;
    }

    const { otpEmailVerificationEnabled } = await this.settings.getPublic();
    const skipInviteEmail =
      dto.role !== UserRole.ADMIN && !otpEmailVerificationEnabled;

    const user = this.userRepository.create({
      email,
      name: dto.name.trim(),
      role: dto.role,
      schoolId:
        dto.role === UserRole.DIRECTOR ||
          dto.role === UserRole.BRANCH_DIRECTOR
          ? (schoolId ?? null)
          : dto.role === UserRole.TEACHER || dto.role === UserRole.STUDENT
            ? resolvedSchoolId
            : null,
      branchId:
        dto.role === UserRole.TEACHER ||
          dto.role === UserRole.STUDENT ||
          dto.role === UserRole.BRANCH_DIRECTOR
          ? resolvedBranchId
          : null,
      staffPosition: null,
      staffClearanceActive: false,
      ...(skipInviteEmail ? { emailVerifiedAt: new Date() } : {}),
    });

    await this.userRepository.save(user);

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

    if (dto.role !== UserRole.ADMIN && otpEmailVerificationEnabled) {
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
    if (
      currentUser.role === UserRole.STUDENT &&
      currentUser.branchId &&
      currentUser.schoolId
    ) {
      return this.userRepository.find({
        where: {
          role: UserRole.TEACHER,
          branchId: currentUser.branchId,
          schoolId: currentUser.schoolId,
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
      'Only a school director, branch director, or student (own branch) can list teachers this way',
    );
  }

  async findStudentsWithRequiredDocs(branchId: string) {
    return this.userRepository.find({
      where: { branchId, role: UserRole.STUDENT },
      relations: ['requiredDocTypes', 'studentProfile'],
    });
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
        relations: ['school', 'branch'],
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
        'studentProfile',
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
    dto: {
      name?: string;
      password?: string;
      schoolId?: string;
      branchId?: string;
    },
    actor: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    const adminScopePatch =
      actor.role === UserRole.ADMIN &&
      (dto.schoolId !== undefined || dto.branchId !== undefined);
    if (
      dto.name === undefined &&
      (dto.password === undefined || dto.password === '') &&
      !adminScopePatch
    ) {
      throw new BadRequestException(
        'Provide name and/or a new password to update',
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
        'Cannot assign school or branch to a platform admin',
      );
    }

    if (actor.id === target.id) {
      if (actor.role !== UserRole.ADMIN) {
        throw new ForbiddenException(
          'You cannot change your own account. Ask a supervisor.',
        );
      }
    } else {
      await this.assertSuperiorCanPatchUser(actor, target);
    }

    const data: {
      name?: string;
      password?: string;
      schoolId?: string | null;
      branchId?: string | null;
    } = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    if (dto.password !== undefined && dto.password.length > 0) {
      data.password = await bcrypt.hash(dto.password, 12);
    }

    if (actor.role === UserRole.ADMIN && dto.schoolId !== undefined) {
      const sid = dto.schoolId.trim();
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
      }
    }

    if (actor.role === UserRole.ADMIN && dto.branchId !== undefined) {
      const bid = dto.branchId.trim();
      if (target.role === UserRole.TEACHER) {
        if (bid) {
          const b = await this.branchService.findOneById(bid);
          if (!b) {
            throw new NotFoundException('Branch not found');
          }
          data.branchId = bid;
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

    await this.userRepository.update(targetId, data);

    return this.userRepository.findOne({
      where: { id: targetId },
      relations: ['school', 'branch'],
    });
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
    if (
      u.role === UserRole.TEACHER ||
      u.role === UserRole.BRANCH_DIRECTOR ||
      u.role === UserRole.STUDENT
    ) {
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
        dto.role !== UserRole.STUDENT &&
        dto.role !== UserRole.BRANCH_DIRECTOR
      ) {
        throw new ForbiddenException(
          'You can only create teachers, students, or branch directors',
        );
      }
      return;
    }
    if (currentUser.role === UserRole.BRANCH_DIRECTOR) {
      if (dto.role !== UserRole.TEACHER && dto.role !== UserRole.STUDENT) {
        throw new ForbiddenException(
          'You can only create teachers or students for your branch',
        );
      }
      return;
    }
    throw new ForbiddenException('Insufficient permissions');
  }

  private async resolveScopeForCreate(
    dto: CreateUserDto,
    currentUser: {
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ): Promise<{ schoolId: string | null; branchId: string | null }> {
    if (dto.role === UserRole.ADMIN) {
      return { schoolId: null, branchId: null };
    }
    if (currentUser.role === UserRole.ADMIN) {
      if (dto.role === UserRole.DIRECTOR) {
        return { schoolId: dto.schoolId ?? null, branchId: null };
      }
      if (dto.role === UserRole.BRANCH_DIRECTOR) {
        if (dto.branchId) {
          const b = await this.branchService.findOneById(dto.branchId);
          if (!b) {
            throw new NotFoundException('Branch not found');
          }
          return { schoolId: b.schoolId, branchId: dto.branchId };
        }
        return { schoolId: dto.schoolId ?? null, branchId: null };
      }
      if (dto.role === UserRole.TEACHER || dto.role === UserRole.STUDENT) {
        return { schoolId: null, branchId: dto.branchId ?? null };
      }
      return { schoolId: null, branchId: null };
    }
    if (currentUser.role === UserRole.DIRECTOR) {
      if (!currentUser.schoolId) {
        throw new ForbiddenException('Your account is not linked to a school');
      }
      if (dto.role === UserRole.BRANCH_DIRECTOR) {
        if (dto.branchId) {
          return { schoolId: currentUser.schoolId, branchId: dto.branchId };
        }
        return { schoolId: currentUser.schoolId, branchId: null };
      }
      return { schoolId: null, branchId: dto.branchId ?? null };
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
      .where('u.role IN (:...roles)', { roles: [UserRole.TEACHER, UserRole.STUDENT] })
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
}

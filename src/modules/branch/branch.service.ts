import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Branch } from '../../entities/branch.entity';
import { User } from '../../entities/user.entity';
import { UserRole } from '../common/enums/database.enum';
import {
  canManageBranchLikeDirector,
  canManageSchoolBranches,
  directorOwnsBranchSchool,
} from '../auth/school-scope.util';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
  ) { }

  async findBySchoolId(schoolId: string) {
    return this.branchRepository.find({
      where: { schoolId },
      select: { id: true, name: true, schoolId: true },
    });
  }

  async findOneById(id: string) {
    return this.branchRepository.findOne({ where: { id } });
  }

  async create(
    schoolId: string,
    dto: CreateBranchDto,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    if (!canManageSchoolBranches(user, schoolId)) {
      throw new ForbiddenException('Cannot create branches for this school');
    }

    return this.dataSource.transaction(async (manager) => {
      let branch = manager.create(Branch, {
        name: dto.name.trim(),
        schoolId,
        address: dto.address ?? null,
        city: dto.city ?? null,
        state: dto.state ?? null,
        zipCode: dto.zipCode ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        minAge: dto.minAge ?? null,
        maxAge: dto.maxAge ?? null,
        totalCapacity: dto.totalCapacity ?? null,
        isPrimary: dto.isPrimary ?? false,
        notes: dto.notes ?? null,
        isActive: true,
      });
      branch = await manager.save(Branch, branch);

      if (branch.isPrimary) {
        await manager
          .createQueryBuilder()
          .update(Branch)
          .set({ isPrimary: false })
          .where('school_id = :sid', { sid: schoolId })
          .andWhere('id != :id', { id: branch.id })
          .execute();
      }

      await this.syncBranchDirectorForBranch(
        manager,
        branch,
        dto.branchDirectorUserId,
      );

      return manager.findOneOrFail(Branch, { where: { id: branch.id } });
    });
  }

  async findAllBySchool(
    schoolId: string,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    if (user.role === UserRole.BRANCH_DIRECTOR) {
      if (!user.branchId || user.schoolId !== schoolId) {
        throw new ForbiddenException('Cannot access branches for this school');
      }
      const b = await this.branchRepository.findOne({
        where: { id: user.branchId, schoolId },
      });
      if (!b) {
        throw new ForbiddenException('Cannot access branches for this school');
      }
      return [b];
    }

    if (!canManageSchoolBranches(user, schoolId)) {
      throw new ForbiddenException('Cannot access this school');
    }

    return this.branchRepository.find({
      where: { schoolId },
      order: { name: 'ASC' },
    });
  }

  async findOne(
    id: string,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ['school', 'users'],
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    await this.ensureCanAccessBranchRecord(branch, user);

    // Filter users to only show BRANCH_DIRECTORs as per original logic
    if (branch.users) {
      branch.users = branch.users.filter(u => u.role === UserRole.BRANCH_DIRECTOR);
    }

    return branch;
  }

  async listTeachers(
    id: string,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    await this.ensureCanAccessBranchRecord(branch, user);

    return this.userService.findTeachersByBranchId(id);
  }

  async update(
    id: string,
    dto: UpdateBranchDto,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const schoolLevel = canManageSchoolBranches(user, branch.schoolId);
    const branchLevel = canManageBranchLikeDirector(user, branch);
    if (!schoolLevel && !branchLevel) {
      throw new ForbiddenException('Cannot update this branch');
    }

    if (dto.branchDirectorUserId !== undefined && !schoolLevel) {
      throw new ForbiddenException(
        'Only a school director, school admin, or platform admin can assign or remove a branch director',
      );
    }

    const patchKeys: (keyof UpdateBranchDto)[] = [
      'name',
      'address',
      'city',
      'state',
      'zipCode',
      'phone',
      'email',
      'minAge',
      'maxAge',
      'totalCapacity',
      'isPrimary',
      'notes',
      'branchDirectorUserId',
    ];
    if (!patchKeys.some((k) => dto[k] !== undefined)) {
      throw new BadRequestException('Provide at least one field to update');
    }

    return this.dataSource.transaction(async (manager) => {
      await this.syncBranchDirectorForBranch(
        manager,
        branch,
        dto.branchDirectorUserId,
      );

      if (dto.name !== undefined) {
        branch.name = dto.name.trim();
      }
      if (dto.address !== undefined) {
        branch.address = dto.address ?? null;
      }
      if (dto.city !== undefined) {
        branch.city = dto.city ?? null;
      }
      if (dto.state !== undefined) {
        branch.state = dto.state ?? null;
      }
      if (dto.zipCode !== undefined) {
        branch.zipCode = dto.zipCode ?? null;
      }
      if (dto.phone !== undefined) {
        branch.phone = dto.phone ?? null;
      }
      if (dto.email !== undefined) {
        branch.email = dto.email ?? null;
      }
      if (dto.minAge !== undefined) {
        branch.minAge = dto.minAge ?? null;
      }
      if (dto.maxAge !== undefined) {
        branch.maxAge = dto.maxAge ?? null;
      }
      if (dto.totalCapacity !== undefined) {
        branch.totalCapacity = dto.totalCapacity ?? null;
      }
      if (dto.notes !== undefined) {
        branch.notes = dto.notes ?? null;
      }
      if (dto.isPrimary !== undefined) {
        branch.isPrimary = dto.isPrimary;
      }

      await manager.save(Branch, branch);

      if (branch.isPrimary) {
        await manager
          .createQueryBuilder()
          .update(Branch)
          .set({ isPrimary: false })
          .where('school_id = :sid', { sid: branch.schoolId })
          .andWhere('id != :id', { id: branch.id })
          .execute();
      }

      const result = await manager.findOne(Branch, {
        where: { id },
        relations: ['school', 'users'],
      });

      if (result?.users) {
        result.users = result.users.filter(u => u.role === UserRole.BRANCH_DIRECTOR);
      }

      return result;
    });
  }

  async remove(
    id: string,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!canManageSchoolBranches(user, branch.schoolId)) {
      throw new ForbiddenException('Cannot delete this branch');
    }

    return this.branchRepository.remove(branch);
  }

  private async syncBranchDirectorForBranch(
    manager: EntityManager,
    branch: { id: string; schoolId: string },
    incoming: string | undefined,
  ): Promise<void> {
    if (incoming === undefined) {
      return;
    }

    const trimmed = incoming.trim();

    if (!trimmed) {
      const bds = await manager.find(User, {
        where: {
          branchId: branch.id,
          role: UserRole.BRANCH_DIRECTOR,
        },
      });
      for (const bd of bds) {
        bd.branchId = null;
        bd.schoolId = branch.schoolId;
      }
      await manager.save(User, bds);
      return;
    }

    const directorUser = await manager.findOne(User, {
      where: { id: trimmed },
    });

    if (!directorUser) {
      throw new NotFoundException('Branch director user not found');
    }

    if (directorUser.role === UserRole.ADMIN) {
      throw new BadRequestException(
        'A platform admin cannot be assigned as a branch director',
      );
    }

    if (directorUser.role !== UserRole.BRANCH_DIRECTOR) {
      throw new BadRequestException(
        'Selected user must have the branch director role',
      );
    }

    if (directorUser.branchId != null && directorUser.branchId !== branch.id) {
      throw new BadRequestException(
        'Selected user is already assigned to another branch; choose someone in the pool or reassign them first',
      );
    }

    if (
      directorUser.schoolId != null &&
      directorUser.schoolId !== branch.schoolId
    ) {
      throw new BadRequestException(
        'Branch director belongs to a different school',
      );
    }

    // Unassign others
    const others = await manager.find(User, {
      where: {
        branchId: branch.id,
        role: UserRole.BRANCH_DIRECTOR,
      },
    });
    for (const other of others) {
      if (other.id !== trimmed) {
        other.branchId = null;
        other.schoolId = branch.schoolId;
      }
    }
    await manager.save(User, others);

    // Assign new
    directorUser.branchId = branch.id;
    directorUser.schoolId = branch.schoolId;
    directorUser.staffPosition = null;
    directorUser.staffClearanceActive = false;
    await manager.save(User, directorUser);
  }

  private async ensureCanAccessBranchRecord(
    branch: { id: string; schoolId: string },
    user: {
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
      id?: string;
    },
  ) {
    if (user.role === UserRole.ADMIN) return;

    if (
      user.role === UserRole.DIRECTOR &&
      user.schoolId === branch.schoolId
    )
      return;

    if (directorOwnsBranchSchool(user, branch.schoolId)) return;

    if (canManageBranchLikeDirector(user, branch)) return;

    if (user.role === UserRole.TEACHER && user.branchId === branch.id) return;

    throw new ForbiddenException('Cannot access this branch');
  }
}

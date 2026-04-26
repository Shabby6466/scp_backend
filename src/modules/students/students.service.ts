import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentProfile } from '../../entities/student-profile.entity';
import { User } from '../../entities/user.entity';
import { Branch } from '../../entities/branch.entity';
import { UserRole } from '../common/enums/database.enum';
import { isSchoolDirector } from '../auth/school-scope.util';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';

type Actor = { id: string; role: UserRole; schoolId: string | null; branchId: string | null };

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(StudentProfile)
    private readonly profiles: Repository<StudentProfile>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Branch)
    private readonly branches: Repository<Branch>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  private normalizeBranchPayload(raw: unknown): string | null {
    if (raw === null || raw === undefined) return null;
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

  private async assertActorCanSetStudentBranch(
    actor: Actor,
    row: StudentProfile,
    branchId: string | null,
  ) {
    if (actor.role === UserRole.ADMIN) {
      return;
    }
    if (isSchoolDirector(actor)) {
      if (!actor.schoolId || actor.schoolId !== row.schoolId) {
        throw new ForbiddenException('Cannot update students outside your school');
      }
      if (branchId) {
        const b = await this.branches.findOne({ where: { id: branchId } });
        if (!b || b.schoolId !== actor.schoolId) {
          throw new BadRequestException('Branch must belong to your school');
        }
      }
      return;
    }
    if (actor.role === UserRole.BRANCH_DIRECTOR) {
      if (!actor.schoolId || !actor.branchId || actor.schoolId !== row.schoolId) {
        throw new ForbiddenException('Cannot update students outside your branch scope');
      }
      if (branchId !== null && branchId !== actor.branchId) {
        throw new ForbiddenException('You can only assign students to your branch');
      }
      return;
    }
    throw new ForbiddenException('Insufficient permissions');
  }

  private assertActorCanManageStudentRow(actor: Actor, row: StudentProfile) {
    if (actor.role === UserRole.ADMIN) return;
    if (isSchoolDirector(actor)) {
      if (!actor.schoolId || actor.schoolId !== row.schoolId) {
        throw new ForbiddenException('Cannot update students outside your school');
      }
      return;
    }
    if (actor.role === UserRole.BRANCH_DIRECTOR) {
      if (
        !actor.schoolId ||
        !actor.branchId ||
        actor.schoolId !== row.schoolId ||
        row.branchId !== actor.branchId
      ) {
        throw new ForbiddenException('Cannot update students outside your branch');
      }
      return;
    }
    throw new ForbiddenException('Insufficient permissions');
  }

  async create(
    actor: Actor,
    body: any,
  ): Promise<{ id: string }> {
    // Accept both camelCase and snake_case payloads from legacy UI.
    const firstName = (body.firstName ?? body.first_name ?? '').trim();
    const lastName = (body.lastName ?? body.last_name ?? '').trim();
    const dateOfBirth = body.dateOfBirth ?? body.date_of_birth;
    const gradeLevel = (body.gradeLevel ?? body.grade_level ?? null) as string | null;
    const schoolIdFromBody = body.schoolId ?? body.school_id ?? null;
    const branchIdFromBody = this.normalizeBranchPayload(
      body.branchId ?? body.branch_id,
    );
    const parentId = body.parentId ?? body.parent_id ?? null;
    const emailRaw = (
      body.email ??
      body.childEmail ??
      body.child_email ??
      ''
    ).trim();
    if (!emailRaw) {
      throw new BadRequestException(
        'email is required to create a student login account',
      );
    }

    if (!firstName || !lastName) throw new BadRequestException('firstName and lastName are required');
    if (!dateOfBirth) throw new BadRequestException('dateOfBirth is required');

    if (actor.role !== UserRole.PARENT && actor.role !== UserRole.ADMIN && actor.role !== UserRole.DIRECTOR && actor.role !== UserRole.BRANCH_DIRECTOR) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const dob = new Date(`${dateOfBirth}T12:00:00.000Z`);
    if (Number.isNaN(dob.getTime())) {
      throw new BadRequestException('Invalid dateOfBirth');
    }

    if (actor.role === UserRole.PARENT) {
      if (parentId && String(parentId) !== actor.id) {
        throw new ForbiddenException('Parents can only create students for their own account');
      }
      if (schoolIdFromBody && schoolIdFromBody !== actor.schoolId) {
        throw new ForbiddenException('Cannot create student in another school');
      }
    }

    let resolvedParent: User | null = null;
    if (parentId) {
      resolvedParent = await this.users.findOne({ where: { id: parentId } });
      if (!resolvedParent) throw new NotFoundException('Parent not found');
    } else if (actor.role === UserRole.PARENT) {
      resolvedParent = await this.users.findOne({ where: { id: actor.id } });
    }

    const resolvedSchoolId =
      schoolIdFromBody ?? resolvedParent?.schoolId ?? actor.schoolId;
    const resolvedBranchId =
      branchIdFromBody ?? resolvedParent?.branchId ?? actor.branchId;
    if (!resolvedSchoolId) throw new BadRequestException('schoolId is required');

    if (actor.role === UserRole.DIRECTOR) {
      if (!actor.schoolId || resolvedSchoolId !== actor.schoolId) {
        throw new ForbiddenException('Cannot create students outside your school');
      }
    }
    if (actor.role === UserRole.BRANCH_DIRECTOR) {
      if (!actor.schoolId || !actor.branchId) {
        throw new ForbiddenException('Branch director is missing school or branch assignment');
      }
      if (resolvedSchoolId !== actor.schoolId) {
        throw new ForbiddenException('Cannot create students outside your school');
      }
      if (resolvedBranchId !== actor.branchId) {
        throw new ForbiddenException('Students must be created in your branch');
      }
    }

    if (resolvedParent) {
      if (resolvedParent.role !== UserRole.PARENT) {
        throw new BadRequestException('Linked user must have the parent role');
      }
      if (
        resolvedParent.schoolId &&
        resolvedParent.schoolId !== resolvedSchoolId
      ) {
        throw new BadRequestException('Parent does not belong to the target school');
      }
      if (
        actor.role === UserRole.BRANCH_DIRECTOR &&
        resolvedParent.branchId &&
        resolvedParent.branchId !== actor.branchId
      ) {
        throw new ForbiddenException('Parent is not in your branch');
      }
    }

    if (resolvedBranchId) {
      const b = await this.branches.findOne({ where: { id: resolvedBranchId } });
      if (!b) throw new NotFoundException('Branch not found');
      if (b.schoolId !== resolvedSchoolId) {
        throw new BadRequestException('Branch must belong to the student school');
      }
    }

    const passwordInput = body.password;
    const createDto: CreateUserDto = {
      email: emailRaw.toLowerCase(),
      first_name: firstName,
      last_name: lastName,
      role: UserRole.STUDENT,
      school_id: resolvedSchoolId,
      branch_id: resolvedBranchId ?? undefined,
      date_of_birth:
        typeof dateOfBirth === 'string'
          ? dateOfBirth
          : dateOfBirth instanceof Date
            ? dateOfBirth.toISOString().slice(0, 10)
            : String(dateOfBirth),
      grade_level: gradeLevel?.trim() || undefined,
      ...(resolvedParent ? { parent_id: resolvedParent.id } : {}),
      ...(typeof passwordInput === 'string' && passwordInput.trim()
        ? { password: passwordInput.trim() }
        : {}),
    };

    const createdUser = await this.userService.createUser(createDto, {
      id: actor.id,
      role: actor.role,
      schoolId: actor.schoolId,
      branchId: actor.branchId,
    });

    const profile = await this.profiles.findOne({
      where: { userId: createdUser!.id },
    });
    if (!profile) {
      throw new BadRequestException('Student profile was not created');
    }

    return { id: profile.id };
  }

  async update(actor: Actor, id: string, body: any) {
    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.DIRECTOR && actor.role !== UserRole.BRANCH_DIRECTOR) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const row = await this.profiles.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Student not found');
    this.assertActorCanManageStudentRow(actor, row);

    if (body.firstName !== undefined || body.first_name !== undefined) {
      row.firstName = (body.firstName ?? body.first_name ?? '').trim() || null;
    }
    if (body.lastName !== undefined || body.last_name !== undefined) {
      row.lastName = (body.lastName ?? body.last_name ?? '').trim() || null;
    }
    if (body.gradeLevel !== undefined || body.grade_level !== undefined) {
      row.gradeLevel = (body.gradeLevel ?? body.grade_level ?? null) as any;
    }

    if (body.branchId !== undefined || body.branch_id !== undefined) {
      const branchId = this.normalizeBranchPayload(
        body.branchId ?? body.branch_id,
      );
      await this.assertActorCanSetStudentBranch(actor, row, branchId);
      row.branchId = branchId;
      if (branchId) {
        const b = await this.branches.findOne({ where: { id: branchId } });
        if (!b) {
          throw new NotFoundException('Branch not found');
        }
        if (row.schoolId && b.schoolId !== row.schoolId) {
          throw new BadRequestException('Branch must belong to the student school');
        }
        if (!row.schoolId) {
          row.schoolId = b.schoolId;
        }
      }
    }

    return this.profiles.save(row);
  }
}


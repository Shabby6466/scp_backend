import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StudentProfile } from '../../entities/student-profile.entity';
import { StudentParent } from '../../entities/student-parent.entity';
import { User } from '../../entities/user.entity';
import { UserRole } from '../common/enums/database.enum';

type Actor = { id: string; role: UserRole; schoolId: string | null; branchId: string | null };

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(StudentProfile)
    private readonly profiles: Repository<StudentProfile>,
    @InjectRepository(StudentParent)
    private readonly links: Repository<StudentParent>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly ds: DataSource,
  ) {}

  async create(
    actor: Actor,
    body: any,
  ): Promise<{ id: string }> {
    // Accept both camelCase and snake_case payloads from legacy UI.
    const firstName = (body.firstName ?? body.first_name ?? '').trim();
    const lastName = (body.lastName ?? body.last_name ?? '').trim();
    const dateOfBirth = body.dateOfBirth ?? body.date_of_birth;
    const gradeLevel = (body.gradeLevel ?? body.grade_level ?? null) as string | null;
    const schoolId = body.schoolId ?? body.school_id ?? null;
    const branchId = body.branchId ?? body.branch_id ?? null;
    const parentId = body.parentId ?? body.parent_id ?? null;

    if (!firstName || !lastName) throw new BadRequestException('firstName and lastName are required');
    if (!dateOfBirth) throw new BadRequestException('dateOfBirth is required');

    if (actor.role !== UserRole.PARENT && actor.role !== UserRole.ADMIN && actor.role !== UserRole.DIRECTOR && actor.role !== UserRole.BRANCH_DIRECTOR) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const dob = new Date(`${dateOfBirth}T12:00:00.000Z`);
    if (Number.isNaN(dob.getTime())) {
      throw new BadRequestException('Invalid dateOfBirth');
    }

    let resolvedParent: User | null = null;
    if (parentId) {
      resolvedParent = await this.users.findOne({ where: { id: parentId } });
      if (!resolvedParent) throw new NotFoundException('Parent not found');
    } else if (actor.role === UserRole.PARENT) {
      resolvedParent = await this.users.findOne({ where: { id: actor.id } });
    }

    const resolvedSchoolId = schoolId ?? resolvedParent?.schoolId ?? actor.schoolId;
    const resolvedBranchId = branchId ?? resolvedParent?.branchId ?? actor.branchId;
    if (!resolvedSchoolId) throw new BadRequestException('schoolId is required');

    const created = await this.ds.transaction(async (m) => {
      const profile = m.create(StudentProfile, {
        firstName,
        lastName,
        dateOfBirth: dob,
        gradeLevel: gradeLevel?.trim() || null,
        schoolId: resolvedSchoolId,
        branchId: resolvedBranchId,
      });
      await m.save(profile);

      if (resolvedParent) {
        const link = m.create(StudentParent, {
          studentProfileId: profile.id,
          parentId: resolvedParent.id,
          relation: 'parent',
          isPrimary: true,
        });
        await m.save(link);
      }
      return profile;
    });

    return { id: created.id };
  }

  async update(actor: Actor, id: string, body: any) {
    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.DIRECTOR && actor.role !== UserRole.BRANCH_DIRECTOR) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const row = await this.profiles.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Student not found');

    if (body.firstName !== undefined || body.first_name !== undefined) {
      row.firstName = (body.firstName ?? body.first_name ?? '').trim() || null;
    }
    if (body.lastName !== undefined || body.last_name !== undefined) {
      row.lastName = (body.lastName ?? body.last_name ?? '').trim() || null;
    }
    if (body.gradeLevel !== undefined || body.grade_level !== undefined) {
      row.gradeLevel = (body.gradeLevel ?? body.grade_level ?? null) as any;
    }
    return this.profiles.save(row);
  }
}


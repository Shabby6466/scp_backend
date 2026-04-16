import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherPosition } from '../../entities/teacher-position.entity';
import { UserRole } from '../common/enums/database.enum';
import { BranchService } from '../branch/branch.service';
import { CreateTeacherPositionDto } from './dto/create-teacher-position.dto';
import { UpdateTeacherPositionDto } from './dto/update-teacher-position.dto';

type Actor = { role: UserRole; schoolId: string | null; branchId: string | null };

@Injectable()
export class TeacherPositionService {
  constructor(
    @InjectRepository(TeacherPosition)
    private readonly repo: Repository<TeacherPosition>,
    private readonly branches: BranchService,
  ) {}

  private async resolveSchoolScope(actor: Actor, schoolId?: string | null): Promise<string> {
    if (actor.role === UserRole.ADMIN) {
      if (!schoolId) {
        throw new ForbiddenException('schoolId is required');
      }
      return schoolId;
    }

    if (actor.role === UserRole.DIRECTOR) {
      if (!actor.schoolId) {
        throw new ForbiddenException('Account has no school scope');
      }
      if (schoolId && schoolId !== actor.schoolId) {
        throw new ForbiddenException('Cannot access another school');
      }
      return actor.schoolId;
    }

    if (actor.role === UserRole.BRANCH_DIRECTOR) {
      if (actor.schoolId) {
        if (schoolId && schoolId !== actor.schoolId) {
          throw new ForbiddenException('Cannot access another school');
        }
        return actor.schoolId;
      }
      if (!actor.branchId) {
        throw new ForbiddenException('Account has no branch scope');
      }
      const b = await this.branches.findOneById(actor.branchId);
      if (!b) throw new ForbiddenException('Branch not found');
      if (schoolId && schoolId !== b.schoolId) {
        throw new ForbiddenException('Cannot access another school');
      }
      return b.schoolId;
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async list(
    actor: Actor,
    query: { schoolId?: string; isActive?: boolean },
  ) {
    const scopedSchoolId = await this.resolveSchoolScope(actor, query.schoolId);
    const where: any = { schoolId: scopedSchoolId };
    if (typeof query.isActive === 'boolean') where.isActive = query.isActive;
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async create(actor: Actor, dto: CreateTeacherPositionDto) {
    const scopedSchoolId = await this.resolveSchoolScope(actor, dto.schoolId);
    const row = this.repo.create({
      schoolId: scopedSchoolId,
      name: dto.name.trim(),
      description: dto.description ?? null,
      minEducationLevel: dto.minEducationLevel ?? null,
      minCredits: dto.minCredits ?? null,
      minEceCredits: dto.minEceCredits ?? null,
      minYearsExperience: dto.minYearsExperience ?? null,
      requiresCda: dto.requiresCda ?? false,
      requiresStateCert: dto.requiresStateCert ?? false,
      isActive: dto.isActive ?? true,
    });
    return this.repo.save(row);
  }

  async update(actor: Actor, id: string, dto: UpdateTeacherPositionDto) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Position not found');
    await this.resolveSchoolScope(actor, row.schoolId);

    if (dto.name !== undefined) row.name = dto.name.trim();
    if (dto.description !== undefined) row.description = dto.description ?? null;
    if (dto.minEducationLevel !== undefined) row.minEducationLevel = dto.minEducationLevel ?? null;
    if (dto.minCredits !== undefined) row.minCredits = dto.minCredits ?? null;
    if (dto.minEceCredits !== undefined) row.minEceCredits = dto.minEceCredits ?? null;
    if (dto.minYearsExperience !== undefined) row.minYearsExperience = dto.minYearsExperience ?? null;
    if (dto.requiresCda !== undefined) row.requiresCda = dto.requiresCda;
    if (dto.requiresStateCert !== undefined) row.requiresStateCert = dto.requiresStateCert;
    if (dto.isActive !== undefined) row.isActive = dto.isActive;

    return this.repo.save(row);
  }

  async remove(actor: Actor, id: string) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Position not found');
    await this.resolveSchoolScope(actor, row.schoolId);
    await this.repo.delete(id);
    return { success: true };
  }
}


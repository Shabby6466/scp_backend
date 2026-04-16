import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { TeacherEligibilityProfile } from '../../entities/teacher-eligibility-profile.entity';
import { UserRole } from '../common/enums/database.enum';
import { UserService } from '../user/user.service';
import { UpdateEligibilityProfileDto } from './dto/update-eligibility-profile.dto';

type Actor = { id: string; role: UserRole; schoolId: string | null; branchId: string | null };

@Injectable()
export class EligibilityService {
  constructor(
    @InjectRepository(TeacherEligibilityProfile)
    private readonly repo: Repository<TeacherEligibilityProfile>,
    private readonly users: UserService,
  ) {}

  private assertCanAccessSchool(actor: Actor, schoolId: string) {
    if (actor.role === UserRole.ADMIN) return;
    if (actor.role === UserRole.DIRECTOR && actor.schoolId === schoolId) return;
    if (actor.role === UserRole.BRANCH_DIRECTOR && actor.schoolId === schoolId) return;
    throw new ForbiddenException('Cannot access this school');
  }

  /** School / branch directors may manage eligibility for staff in their scope (same as teacher list). */
  private assertCanAccessTargetUser(actor: Actor, target: User) {
    if (actor.id === target.id) return;
    if (actor.role === UserRole.ADMIN) return;
    if (actor.role === UserRole.DIRECTOR && actor.schoolId && target.schoolId === actor.schoolId) {
      return;
    }
    if (
      actor.role === UserRole.BRANCH_DIRECTOR &&
      actor.schoolId &&
      actor.branchId &&
      target.schoolId === actor.schoolId &&
      target.branchId === actor.branchId
    ) {
      return;
    }
    throw new ForbiddenException('Cannot access this profile');
  }

  async listBySchool(actor: Actor, schoolId: string) {
    this.assertCanAccessSchool(actor, schoolId);
    return this.repo.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
    });
  }

  async getForUser(actor: Actor, userId: string) {
    if (actor.id === userId || actor.role === UserRole.ADMIN) {
      return this.findProfileOrThrow(userId);
    }

    const target = await this.users.findOneInternal(userId);
    if (!target) {
      throw new NotFoundException('User not found');
    }
    this.assertCanAccessTargetUser(actor, target);
    return this.findProfileOrThrow(userId);
  }

  private async findProfileOrThrow(userId: string) {
    const row = await this.repo.findOne({ where: { userId } });
    if (!row) {
      throw new NotFoundException('Eligibility profile not found');
    }
    return row;
  }

  async upsertForUser(actor: Actor, userId: string, dto: UpdateEligibilityProfileDto) {
    const user = await this.users.findOneInternal(userId);
    if (!user || !user.schoolId) {
      throw new NotFoundException('User not found or not linked to a school');
    }

    this.assertCanAccessTargetUser(actor, user);

    let row = await this.repo.findOne({ where: { userId } });
    if (!row) {
      row = this.repo.create({ userId, schoolId: user.schoolId });
    }

    if (dto.educationLevel !== undefined) row.educationLevel = dto.educationLevel ?? null;
    if (dto.educationField !== undefined) row.educationField = dto.educationField ?? null;
    if (dto.totalCredits !== undefined) row.totalCredits = dto.totalCredits ?? null;
    if (dto.eceCredits !== undefined) row.eceCredits = dto.eceCredits ?? null;
    if (dto.yearsExperience !== undefined) row.yearsExperience = dto.yearsExperience ?? null;
    if (dto.resumePath !== undefined) row.resumePath = dto.resumePath ?? null;
    if (dto.cdaCredential !== undefined) row.cdaCredential = dto.cdaCredential;
    if (dto.stateCertification !== undefined) row.stateCertification = dto.stateCertification;
    if (dto.firstAidCertified !== undefined) row.firstAidCertified = dto.firstAidCertified;
    if (dto.cprCertified !== undefined) row.cprCertified = dto.cprCertified;
    if (dto.languages !== undefined) row.languages = dto.languages ?? null;
    if (dto.notes !== undefined) row.notes = dto.notes ?? null;

    return this.repo.save(row);
  }

  async analyze(actor: Actor, userId: string) {
    // Placeholder: we don’t have an AI analysis pipeline wired in backend yet.
    // Keep endpoint so frontend doesn’t 404; return current profile.
    const row = await this.getForUser(actor, userId);
    row.aiAnalysis = row.aiAnalysis ?? 'Analysis not configured on this server.';
    row.aiAnalyzedAt = new Date();
    return this.repo.save(row);
  }
}


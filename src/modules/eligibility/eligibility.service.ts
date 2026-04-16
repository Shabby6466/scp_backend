import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async listBySchool(actor: Actor, schoolId: string) {
    this.assertCanAccessSchool(actor, schoolId);
    return this.repo.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
    });
  }

  async getForUser(actor: Actor, userId: string) {
    if (actor.role !== UserRole.ADMIN && actor.id !== userId) {
      // Director/branch director can view staff in their school; keep simple by requiring admin for now.
      // If needed, expand with proper scope checks based on the target user’s school.
      throw new ForbiddenException('Cannot access this profile');
    }
    const row = await this.repo.findOne({ where: { userId } });
    if (!row) {
      throw new NotFoundException('Eligibility profile not found');
    }
    return row;
  }

  async upsertForUser(actor: Actor, userId: string, dto: UpdateEligibilityProfileDto) {
    if (actor.role !== UserRole.ADMIN && actor.id !== userId) {
      throw new ForbiddenException('Cannot update this profile');
    }

    const user = await this.users.findOneInternal(userId);
    if (!user || !user.schoolId) {
      throw new NotFoundException('User not found or not linked to a school');
    }

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


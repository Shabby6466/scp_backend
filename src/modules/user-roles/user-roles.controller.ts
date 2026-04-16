import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Branch } from '../../entities/branch.entity';
import { TeacherProfile } from '../../entities/teacher-profile.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/database.enum';

@Controller('user-roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserRolesController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Branch) private readonly branches: Repository<Branch>,
    @InjectRepository(TeacherProfile)
    private readonly teacherProfiles: Repository<TeacherProfile>,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR)
  async listDirectors(
    @Query('schoolId') schoolId: string,
    @Query('role') role: string,
    @CurrentUser() actor: { role: UserRole; schoolId: string | null },
  ) {
    if (!schoolId) return [];
    if (actor.role === UserRole.DIRECTOR && actor.schoolId !== schoolId) {
      return [];
    }
    if (role !== 'director') return [];

    const directors = await this.users.find({
      where: [
        { role: UserRole.DIRECTOR, schoolId },
        { role: UserRole.BRANCH_DIRECTOR, schoolId },
      ],
      select: { id: true, email: true, name: true, schoolId: true, branchId: true, role: true },
      order: { createdAt: 'ASC' },
    });

    const branchIds = directors.map((d) => d.branchId).filter(Boolean) as string[];
    const branchMap = new Map<string, Branch>();
    if (branchIds.length) {
      const list = await this.branches.find({ where: branchIds.map((id) => ({ id })) });
      for (const b of list) branchMap.set(b.id, b);
    }

    return directors.map((u) => ({
      id: u.id,
      user_id: u.id,
      school_id: u.schoolId,
      branch_id: u.branchId,
      profile: { full_name: u.name, email: u.email },
      branch: u.branchId
        ? { branch_name: branchMap.get(u.branchId)?.name ?? 'Unknown' }
        : null,
    }));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR)
  async updateRole(@Param('id') id: string, @Body() body: { branch_id?: string | null }) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) return { success: false };
    if (body.branch_id !== undefined) {
      user.branchId = body.branch_id ?? null;
      await this.users.save(user);
    }
    return { success: true };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR)
  async removeRole(@Param('id') id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) return { success: false };

    // Revoke director roles back to teacher (best-effort placeholder).
    if (user.role === UserRole.DIRECTOR || user.role === UserRole.BRANCH_DIRECTOR) {
      user.role = UserRole.TEACHER;
      user.authorities = [UserRole.TEACHER];
      user.branchId = null;
      user.schoolId = user.schoolId; // keep for now
      await this.users.save(user);
    }
    return { success: true };
  }

  @Get('/_internal/teacher-profile/:userId')
  @Roles(UserRole.ADMIN)
  async _getTeacherProfile(@Param('userId') userId: string) {
    return this.teacherProfiles.findOne({ where: { userId } });
  }
}


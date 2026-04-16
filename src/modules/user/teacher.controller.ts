import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/database.enum';
import { User } from '../../entities/user.entity';
import { TeacherProfile } from '../../entities/teacher-profile.entity';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeacherController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(TeacherProfile)
    private readonly teacherProfiles: Repository<TeacherProfile>,
  ) {}

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR, UserRole.TEACHER)
  async getTeacher(
    @Param('id') id: string,
    @CurrentUser() actor: { id: string; role: UserRole },
  ) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) return null;
    if (actor.role === UserRole.TEACHER && actor.id !== id) return null;

    const profile = await this.teacherProfiles.findOne({ where: { userId: id } });
    return {
      id: user.id,
      school_id: user.schoolId,
      branch_id: user.branchId,
      email: user.email,
      full_name: user.name,
      position_id: profile?.positionId ?? null,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  async updateTeacher(@Param('id') id: string, @Body() body: { position_id?: string | null }) {
    if (body.position_id === undefined) return { success: true };
    let profile = await this.teacherProfiles.findOne({ where: { userId: id } });
    if (!profile) {
      profile = this.teacherProfiles.create({ userId: id });
    }
    profile.positionId = body.position_id ?? null;
    await this.teacherProfiles.save(profile);
    return { success: true };
  }
}


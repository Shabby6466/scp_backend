import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/database.enum';
import { User } from '../../entities/user.entity';
import { TeacherProfile } from '../../entities/teacher-profile.entity';
import { TeacherPosition } from '../../entities/teacher-position.entity';
import { isSchoolDirector } from '../auth/school-scope.util';

type Actor = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeacherController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(TeacherProfile)
    private readonly teacherProfiles: Repository<TeacherProfile>,
    @InjectRepository(TeacherPosition)
    private readonly teacherPositions: Repository<TeacherPosition>,
  ) {}

  private assertActorCanManageTeacher(actor: Actor, teacher: User) {
    if (actor.role === UserRole.ADMIN) return;
    if (isSchoolDirector(actor)) {
      if (!actor.schoolId || teacher.schoolId !== actor.schoolId) {
        throw new ForbiddenException('Cannot access teachers outside your school');
      }
      return;
    }
    if (actor.role === UserRole.BRANCH_DIRECTOR) {
      if (!actor.branchId || teacher.branchId !== actor.branchId) {
        throw new ForbiddenException('Cannot access teachers outside your branch');
      }
      return;
    }
    throw new ForbiddenException('Insufficient permissions');
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR, UserRole.TEACHER)
  async getTeacher(@Param('id') id: string, @CurrentUser() actor: Actor) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) return null;
    if (actor.role === UserRole.TEACHER) {
      if (actor.id !== id) return null;
    } else if (user.role !== UserRole.TEACHER) {
      return null;
    } else {
      this.assertActorCanManageTeacher(actor, user);
    }

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
  async updateTeacher(
    @Param('id') id: string,
    @Body() body: { position_id?: string | null },
    @CurrentUser() actor: Actor,
  ) {
    if (body.position_id === undefined) return { success: true };

    const teacherUser = await this.users.findOne({ where: { id } });
    if (!teacherUser) throw new NotFoundException('Teacher not found');
    if (teacherUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Target user is not a teacher');
    }
    this.assertActorCanManageTeacher(actor, teacherUser);

    const schoolId = teacherUser.schoolId;
    if (!schoolId) {
      throw new ForbiddenException('Teacher has no school assignment');
    }

    if (body.position_id != null && body.position_id !== '') {
      const pos = await this.teacherPositions.findOne({
        where: { id: body.position_id, schoolId },
      });
      if (!pos) {
        throw new ForbiddenException(
          'Position does not exist or does not belong to the teacher school',
        );
      }
    }

    let profile = await this.teacherProfiles.findOne({ where: { userId: id } });
    if (!profile) {
      profile = this.teacherProfiles.create({ userId: id });
    }
    profile.positionId = body.position_id ?? null;
    await this.teacherProfiles.save(profile);
    return { success: true };
  }
}

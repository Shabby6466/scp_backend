import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/database.enum';
import { TeacherPositionService } from './teacher-position.service';
import { CreateTeacherPositionDto } from './dto/create-teacher-position.dto';
import { UpdateTeacherPositionDto } from './dto/update-teacher-position.dto';

@Controller('teacher-positions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeacherPositionController {
  constructor(private readonly service: TeacherPositionService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  list(
    @Query('schoolId') schoolId: string | undefined,
    @Query('isActive') isActiveRaw: string | undefined,
    @CurrentUser() actor: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    const isActive =
      isActiveRaw === undefined ? undefined : isActiveRaw === 'true' || isActiveRaw === '1';
    return this.service.list(actor, { schoolId, isActive });
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  create(
    @Body() dto: CreateTeacherPositionDto,
    @CurrentUser() actor: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.service.create(actor, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTeacherPositionDto,
    @CurrentUser() actor: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.service.update(actor, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  remove(
    @Param('id') id: string,
    @CurrentUser() actor: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.service.remove(actor, id);
  }
}


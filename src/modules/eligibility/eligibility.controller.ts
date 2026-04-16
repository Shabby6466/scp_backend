import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/database.enum';
import { EligibilityService } from './eligibility.service';
import { UpdateEligibilityProfileDto } from './dto/update-eligibility-profile.dto';

@Controller('eligibility-profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EligibilityController {
  constructor(private readonly service: EligibilityService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  listBySchool(
    @Query('schoolId') schoolId: string,
    @CurrentUser() actor: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.service.listBySchool(actor, schoolId);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR, UserRole.TEACHER)
  getForUser(
    @Param('userId') userId: string,
    @CurrentUser() actor: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.service.getForUser(actor, userId);
  }

  @Put('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  upsertForUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateEligibilityProfileDto,
    @CurrentUser() actor: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.service.upsertForUser(actor, userId, dto);
  }

  @Post('user/:userId/analyze')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  analyze(
    @Param('userId') userId: string,
    @CurrentUser() actor: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.service.analyze(actor, userId);
  }
}


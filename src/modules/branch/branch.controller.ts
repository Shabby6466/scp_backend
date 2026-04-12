import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BranchService } from './branch.service';
import { BranchDashboardService } from './branch-dashboard.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/database.enum';

@Controller()
@UseGuards(JwtAuthGuard)
export class BranchController {
  constructor(
    private readonly branchService: BranchService,
    private readonly branchDashboardService: BranchDashboardService,
  ) { }

  @Post('schools/:schoolId/branches')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR)
  create(
    @Param('schoolId') schoolId: string,
    @Body() dto: CreateBranchDto,
    @CurrentUser()
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.branchService.create(schoolId, dto, user);
  }

  @Get('schools/:schoolId/branches')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTOR,
    UserRole.DIRECTOR,
    UserRole.BRANCH_DIRECTOR,
  )
  findAllBySchool(
    @Param('schoolId') schoolId: string,
    @CurrentUser()
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.branchService.findAllBySchool(schoolId, user);
  }

  @Get('branches/:id/dashboard-summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR)
  dashboardSummary(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.branchDashboardService.getDashboardSummary(id, user);
  }

  @Get('branches/:id/documents/recent')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTOR,
    UserRole.DIRECTOR,
    UserRole.BRANCH_DIRECTOR,
  )
  recentDocuments(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    const safe = Math.min(Math.max(limit, 1), 100);
    return this.branchDashboardService.getRecentDocuments(id, user, safe);
  }

  @Get('branches/:id/compliance/people')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTOR,
    UserRole.DIRECTOR,
    UserRole.BRANCH_DIRECTOR,
  )
  compliancePeople(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.branchDashboardService.getCompliancePeople(id, user);
  }

  @Get('branches/:id')
  findOne(
    @Param('id') id: string,
    @CurrentUser()
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.branchService.findOne(id, user);
  }

  @Get('branches/:id/teachers')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTOR,
    UserRole.DIRECTOR,
    UserRole.BRANCH_DIRECTOR,
  )
  listTeachers(
    @Param('id') id: string,
    @CurrentUser()
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.branchService.listTeachers(id, user);
  }

  @Patch('branches/:id')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTOR,
    UserRole.DIRECTOR,
    UserRole.BRANCH_DIRECTOR,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser()
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.branchService.update(id, dto, user);
  }

  @Delete('branches/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR)
  remove(
    @Param('id') id: string,
    @CurrentUser()
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.branchService.remove(id, user);
  }
}

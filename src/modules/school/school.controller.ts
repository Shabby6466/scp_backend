import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/database.enum';

@Controller('schools')
@UseGuards(JwtAuthGuard)
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) { }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateSchoolDto) {
    return this.schoolService.create(dto);
  }

  @Get()
  findAll(@CurrentUser() user: { role: UserRole; schoolId: string | null }) {
    return this.schoolService.findAll(user);
  }

  @Get(':id/dashboard-summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
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
    return this.schoolService.getDashboardSummary(id, user);
  }

  @Get(':id/compliance-requirements')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  listComplianceRequirements(
    @Param('id') id: string,
    @CurrentUser()
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.schoolService.listComplianceRequirements(id, user);
  }

  @Get(':id/inspection-types')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  listInspectionTypes(
    @Param('id') id: string,
    @CurrentUser()
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.schoolService.listInspectionTypes(id, user);
  }

  @Get(':id/certification-records')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  listCertificationRecords(
    @Param('id') id: string,
    @CurrentUser()
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.schoolService.listCertificationRecords(id, user);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  approve(
    @Param('id') id: string,
    @CurrentUser() user: { role: UserRole; schoolId: string | null },
  ) {
    return this.schoolService.approve(id);
  }

  @Post(':id/inspection-types')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  createInspectionType(@Param('id') id: string, @Body() body: any) {
    return this.schoolService.createInspectionType(id, body);
  }

  @Patch(':id/inspection-types/:inspectionTypeId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  updateInspectionType(
    @Param('inspectionTypeId') inspectionTypeId: string,
    @Body() body: any,
  ) {
    return this.schoolService.updateInspectionType(inspectionTypeId, body);
  }

  @Delete(':id/inspection-types/:inspectionTypeId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  removeInspectionType(@Param('inspectionTypeId') inspectionTypeId: string) {
    return this.schoolService.removeInspectionType(inspectionTypeId);
  }

  @Post(':id/compliance-requirements')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  createComplianceRequirement(@Param('id') id: string, @Body() body: any) {
    return this.schoolService.createComplianceRequirement(id, body);
  }

  @Patch(':id/compliance-requirements/:requirementId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  updateComplianceRequirement(
    @Param('requirementId') requirementId: string,
    @Body() body: any,
  ) {
    return this.schoolService.updateComplianceRequirement(requirementId, body);
  }

  @Delete(':id/compliance-requirements/:requirementId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  removeComplianceRequirement(@Param('requirementId') requirementId: string) {
    return this.schoolService.removeComplianceRequirement(requirementId);
  }

  @Post(':id/certification-records')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  createCertificationRecord(@Param('id') id: string, @Body() body: any) {
    return this.schoolService.createCertificationRecord(id, body);
  }

  @Patch(':id/certification-records/:recordId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  updateCertificationRecord(@Param('recordId') recordId: string, @Body() body: any) {
    return this.schoolService.updateCertificationRecord(recordId, body);
  }

  @Delete(':id/certification-records/:recordId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  removeCertificationRecord(@Param('recordId') recordId: string) {
    return this.schoolService.removeCertificationRecord(recordId);
  }

  /** Enrolled children (student profiles), not login users. */
  @Get(':id/students')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR, UserRole.TEACHER)
  listStudentProfiles(
    @Param('id') id: string,
    @CurrentUser()
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.schoolService.listStudentProfiles(id, user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { role: UserRole; schoolId: string | null },
  ) {
    return this.schoolService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSchoolDto,
    @CurrentUser() user: { role: UserRole; schoolId: string | null },
  ) {
    return this.schoolService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.schoolService.remove(id);
  }
}

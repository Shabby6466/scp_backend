import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '../common/enums/database.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StudentParentService } from './student-parent.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { RequiredDocTypeCountsDto } from './dto/required-doc-type-counts.dto';

@Controller('student-profiles')
@UseGuards(JwtAuthGuard)
export class StudentProfileController {
  constructor(private readonly studentParentService: StudentParentService) { }

  @Post('required-document-type-counts')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTOR,
    UserRole.BRANCH_DIRECTOR,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  requiredDocumentTypeCounts(
    @Body() dto: RequiredDocTypeCountsDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.studentParentService.getRequiredDocumentTypeCountsForProfiles(
      dto.studentProfileIds,
      user,
    );
  }

  @Get(':id/required-document-types')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTOR,
    UserRole.BRANCH_DIRECTOR,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  requiredDocumentTypes(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.studentParentService.getRequiredDocumentTypesForStudentProfile(
      id,
      user,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTOR,
    UserRole.BRANCH_DIRECTOR,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findOne(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.studentParentService.getStudentProfileById(id, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTOR,
    UserRole.BRANCH_DIRECTOR,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentProfileDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.studentParentService.updateStudentProfile(id, dto, user);
  }
}

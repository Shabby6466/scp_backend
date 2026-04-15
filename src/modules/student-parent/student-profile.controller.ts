import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserRole } from '../common/enums/database.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StudentParentService } from './student-parent.service';

@Controller('student-profiles')
@UseGuards(JwtAuthGuard)
export class StudentProfileController {
  constructor(private readonly studentParentService: StudentParentService) { }

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
}

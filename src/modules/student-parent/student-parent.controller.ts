import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '../common/enums/database.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StudentParentService } from './student-parent.service';
import { RegisterChildDto } from './dto/register-child.dto';

@Controller('student-parents')
@UseGuards(JwtAuthGuard)
export class StudentParentController {
  constructor(private readonly studentParentService: StudentParentService) { }

  @Post('register-child')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARENT)
  registerChild(
    @Body() dto: RegisterChildDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.studentParentService.registerChild(dto, user);
  }

  @Get('parent/:parentId')
  listForParent(
    @Param('parentId') parentId: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.studentParentService.listForParent(parentId, user);
  }

  /** `studentId` path param is the student profile (enrolled child) id. */
  @Get('student/:studentId')
  listForStudent(
    @Param('studentId') studentProfileId: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.studentParentService.listForStudentProfile(
      studentProfileId,
      user,
    );
  }

  @Post()
  create(
    @Body()
    body: {
      studentProfileId: string;
      parentId: string;
      relation?: string;
      isPrimary?: boolean;
    },
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.studentParentService.create(body, user);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.studentParentService.remove(id, user);
  }
}

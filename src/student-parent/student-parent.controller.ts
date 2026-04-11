import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { StudentParentService } from './student-parent.service.js';

@Controller('student-parents')
@UseGuards(JwtAuthGuard)
export class StudentParentController {
  constructor(private readonly studentParentService: StudentParentService) {}

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

  @Get('student/:studentId')
  listForStudent(
    @Param('studentId') studentId: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.studentParentService.listForStudent(studentId, user);
  }

  @Post()
  create(
    @Body()
    body: {
      studentId: string;
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

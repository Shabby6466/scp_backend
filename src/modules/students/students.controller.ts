import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/database.enum';
import { StudentsService } from './students.service';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly service: StudentsService) {}

  @Post()
  @Roles(UserRole.PARENT, UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  create(
    @Body() body: any,
    @CurrentUser() actor: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.service.create(actor, body);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() actor: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.service.update(actor, id, body);
  }
}


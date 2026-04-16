import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/database.enum';

@Controller('roster')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RosterController {
  @Post('import')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  startImport(@Body() _body: any) {
    return { id: String(Date.now()), status: 'created' };
  }

  @Get('import-jobs/:jobId')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  getJob(@Param('jobId') jobId: string) {
    return { id: jobId, status: 'completed' };
  }

  @Get('import-jobs/:jobId/students')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  getJobStudents(@Param('jobId') _jobId: string) {
    return [];
  }
}


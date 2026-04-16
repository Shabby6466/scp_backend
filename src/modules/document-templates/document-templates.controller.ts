import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/database.enum';

// Placeholder controller: template persistence not implemented yet.
@Controller('document-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentTemplatesController {
  @Get()
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  list(@Query('schoolId') _schoolId?: string) {
    return [];
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() _body: any) {
    return { success: true };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') _id: string, @Body() _body: any) {
    return { success: true };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') _id: string) {
    return { success: true };
  }

  @Get(':id/download-url')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  downloadUrl(@Param('id') id: string) {
    return { url: `/api/document-templates/${id}/download` };
  }
}


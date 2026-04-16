import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CertificationType } from '../../entities/certification-type.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/database.enum';

@Controller('certification-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificationTypesController {
  constructor(
    @InjectRepository(CertificationType)
    private readonly repo: Repository<CertificationType>,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  list(@Query('schoolId') schoolId: string | undefined) {
    if (!schoolId) return [];
    return this.repo.find({ where: { schoolId }, order: { name: 'ASC' } });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  get(@Param('id') id: string) {
    return this.repo.findOne({ where: { id } });
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR)
  create(
    @Body() body: { schoolId: string; name: string; description?: string | null; defaultValidityMonths?: number | null },
    @CurrentUser() actor: { id: string },
  ) {
    const row = this.repo.create({
      schoolId: body.schoolId,
      name: body.name?.trim(),
      description: body.description ?? null,
      defaultValidityMonths: body.defaultValidityMonths ?? 12,
    } as any);
    return this.repo.save(row);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR)
  async update(@Param('id') id: string, @Body() body: any) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) return null;
    if (body.name !== undefined) row.name = String(body.name).trim();
    if (body.description !== undefined) row.description = body.description ?? null;
    if (body.defaultValidityMonths !== undefined) row.defaultValidityMonths = body.defaultValidityMonths ?? null;
    return this.repo.save(row);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.repo.delete(id);
    return { success: true };
  }
}


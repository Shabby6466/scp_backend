import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/database.enum';

type Evidence = {
  id: string;
  requirementId: string;
  title: string;
  createdAt: string;
};

const EVIDENCE: Evidence[] = [];

@Controller('compliance/evidence')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplianceEvidenceController {
  @Get()
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  list(@Query('requirementId') requirementId?: string) {
    if (!requirementId) return EVIDENCE;
    return EVIDENCE.filter((e) => e.requirementId === requirementId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  get(@Param('id') id: string) {
    return EVIDENCE.find((e) => e.id === id) ?? null;
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  create(
    @Body()
    body: { requirementId?: string; requirement_id?: string; title?: string },
  ) {
    const requirementId = body.requirementId ?? body.requirement_id;
    const title = body.title ?? 'Evidence';
    const row: Evidence = {
      id: String(Date.now()),
      requirementId: requirementId ?? 'unknown',
      title,
      createdAt: new Date().toISOString(),
    };
    EVIDENCE.unshift(row);
    return row;
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  remove(@Param('id') id: string) {
    const idx = EVIDENCE.findIndex((e) => e.id === id);
    if (idx >= 0) EVIDENCE.splice(idx, 1);
    return { success: true };
  }
}


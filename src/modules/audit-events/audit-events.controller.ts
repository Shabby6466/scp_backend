import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/database.enum';

/**
 * Placeholder for Supabase-era audit tables. Returns empty lists so admin UI loads;
 * wire to persistence when audit is migrated to Nest/Postgres.
 */
@Controller('audit-events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditEventsController {
  @Get()
  list(
    @Query('type') _type?: string,
    @Query('limit') limit?: string,
    @Query('action') _action?: string,
    @Query('userId') _userId?: string,
    @Query('offset') _offset?: string,
  ) {
    const n = Math.min(Math.max(parseInt(limit || '20', 10) || 20, 1), 500);
    return {
      data: [],
      meta: { total: 0, page: 1, lastPage: 0, limit: n },
    };
  }
}

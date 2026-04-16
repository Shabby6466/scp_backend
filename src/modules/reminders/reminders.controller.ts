import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/database.enum';

@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RemindersController {
  /**
   * Frontend currently calls these endpoints to “send reminders”.
   * The backend email scheduling system isn’t wired yet; return a stable response
   * so the UI can proceed without 404s.
   */

  @Post('send-expiration')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  sendExpiration(@Body() _body: unknown) {
    return { success: true, queued: true };
  }

  @Post('send')
  @Roles(UserRole.ADMIN)
  send(@Body() _body: unknown) {
    return { success: true, queued: true };
  }
}


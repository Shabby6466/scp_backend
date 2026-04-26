import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/database.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RemindersService } from '../reminders/reminders.service';
import { SendReminderDto } from '../reminders/dto/send-reminder.dto';

type JwtUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly reminders: RemindersService) {}

  /** @deprecated Prefer POST /reminders/send-expiration — same implementation. */
  @Post('expiration-reminders')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  expirationReminders(@CurrentUser() user: JwtUser, @Body() body: SendReminderDto) {
    return this.reminders.sendSchoolExpirationReminders(user, body);
  }
}

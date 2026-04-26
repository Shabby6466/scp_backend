import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/database.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RemindersService } from './reminders.service';
import { SendReminderDto } from './dto/send-reminder.dto';

type JwtUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Post('send-expiration')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  sendExpiration(@CurrentUser() user: JwtUser, @Body() body: SendReminderDto) {
    return this.reminders.sendSchoolExpirationReminders(user, body);
  }

  @Post('send')
  @Roles(UserRole.ADMIN)
  send(@CurrentUser() user: JwtUser, @Body() body: SendReminderDto) {
    return this.reminders.sendAdminReminders(user, body);
  }
}

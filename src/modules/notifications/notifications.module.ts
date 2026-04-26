import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [RemindersModule],
  controllers: [NotificationsController],
})
export class NotificationsModule {}

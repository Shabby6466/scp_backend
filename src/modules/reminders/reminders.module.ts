import { Module, forwardRef } from '@nestjs/common';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [
    forwardRef(() => AnalyticsModule),
    forwardRef(() => DocumentModule),
  ],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}

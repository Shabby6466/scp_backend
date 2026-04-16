import { Module } from '@nestjs/common';
import { SchoolApplicationsController } from './school-applications.controller';

@Module({
  controllers: [SchoolApplicationsController],
})
export class SchoolApplicationsModule {}


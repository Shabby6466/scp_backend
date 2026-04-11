import { Module } from '@nestjs/common';
import { StudentParentController } from './student-parent.controller.js';
import { StudentParentService } from './student-parent.service.js';

@Module({
  controllers: [StudentParentController],
  providers: [StudentParentService],
  exports: [StudentParentService],
})
export class StudentParentModule {}

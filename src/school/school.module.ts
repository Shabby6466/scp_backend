import { Module } from '@nestjs/common';
import { SchoolController } from './school.controller.js';
import { SchoolService } from './school.service.js';
import { BranchModule } from '../branch/branch.module.js';

@Module({
  imports: [BranchModule],
  controllers: [SchoolController],
  providers: [SchoolService],
  exports: [SchoolService],
})
export class SchoolModule {}

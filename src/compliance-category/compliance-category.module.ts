import { Module } from '@nestjs/common';
import { ComplianceCategoryController } from './compliance-category.controller.js';
import { ComplianceCategoryService } from './compliance-category.service.js';

@Module({
  controllers: [ComplianceCategoryController],
  providers: [ComplianceCategoryService],
  exports: [ComplianceCategoryService],
})
export class ComplianceCategoryModule {}

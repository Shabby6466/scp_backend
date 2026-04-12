import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceCategoryService } from './compliance-category.service';
import { ComplianceCategoryController } from './compliance-category.controller';
import { ComplianceCategory } from '../../entities/compliance-category.entity';
import { SchoolModule } from '../school/school.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComplianceCategory]),
    forwardRef(() => SchoolModule),
    forwardRef(() => UserModule),
  ],
  controllers: [ComplianceCategoryController],
  providers: [ComplianceCategoryService],
  exports: [ComplianceCategoryService],
})
export class ComplianceCategoryModule { }

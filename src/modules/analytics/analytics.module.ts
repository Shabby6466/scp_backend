import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { UserModule } from '../user/user.module';
import { SchoolModule } from '../school/school.module';
import { BranchModule } from '../branch/branch.module';
import { DocumentModule } from '../document/document.module';
import { DocumentTypeModule } from '../document-type/document-type.module';
import { StudentParentModule } from '../student-parent/student-parent.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => SchoolModule),
    forwardRef(() => BranchModule),
    forwardRef(() => DocumentModule),
    forwardRef(() => DocumentTypeModule),
    forwardRef(() => StudentParentModule),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule { }

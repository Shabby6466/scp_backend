import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchController } from './branch.controller';
import { BranchService } from './branch.service';
import { BranchDashboardService } from './branch-dashboard.service';
import { Branch } from '../../entities/branch.entity';
import { UserModule } from '../user/user.module';
import { SchoolModule } from '../school/school.module';
import { DocumentModule } from '../document/document.module';
import { StudentParentModule } from '../student-parent/student-parent.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Branch]),
    forwardRef(() => UserModule),
    forwardRef(() => SchoolModule),
    forwardRef(() => DocumentModule),
    forwardRef(() => StudentParentModule),
  ],
  controllers: [BranchController],
  providers: [BranchService, BranchDashboardService],
  exports: [BranchService, BranchDashboardService],
})
export class BranchModule { }

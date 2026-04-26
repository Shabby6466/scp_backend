import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { School } from '../../entities/school.entity';
import { InspectionType } from '../../entities/inspection-type.entity';
import { ComplianceRequirement } from '../../entities/compliance-requirement.entity';
import { CertificationRecord } from '../../entities/certification-record.entity';
import { CertificationType } from '../../entities/certification-type.entity';
import { Branch } from '../../entities/branch.entity';
import { InspectionTypeService } from './inspection-type.service';
import { ComplianceRequirementService } from './compliance-requirement.service';
import { CertificationRecordService } from './certification-record.service';
import { UserModule } from '../user/user.module';
import { BranchModule } from '../branch/branch.module';
import { StudentParentModule } from '../student-parent/student-parent.module';
import { ComplianceCategoryModule } from '../compliance-category/compliance-category.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      School,
      InspectionType,
      ComplianceRequirement,
      CertificationRecord,
      CertificationType,
      Branch,
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => BranchModule),
    forwardRef(() => StudentParentModule),
    forwardRef(() => ComplianceCategoryModule),
  ],
  controllers: [SchoolController],
  providers: [
    SchoolService,
    InspectionTypeService,
    ComplianceRequirementService,
    CertificationRecordService,
  ],
  exports: [
    SchoolService,
    InspectionTypeService,
    ComplianceRequirementService,
    CertificationRecordService,
  ],
})
export class SchoolModule { }

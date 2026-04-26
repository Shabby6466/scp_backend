import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificationType } from '../../entities/certification-type.entity';
import { Branch } from '../../entities/branch.entity';
import { CertificationTypesController } from './certification-types.controller';
import { ComplianceCategoryModule } from '../compliance-category/compliance-category.module';
import { SchoolModule } from '../school/school.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CertificationType, Branch]),
    ComplianceCategoryModule,
    forwardRef(() => SchoolModule),
  ],
  controllers: [CertificationTypesController],
})
export class CertificationTypesModule {}

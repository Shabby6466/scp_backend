import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificationType } from '../../entities/certification-type.entity';
import { CertificationTypesController } from './certification-types.controller';
import { ComplianceCategoryModule } from '../compliance-category/compliance-category.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CertificationType]),
    ComplianceCategoryModule,
  ],
  controllers: [CertificationTypesController],
})
export class CertificationTypesModule {}


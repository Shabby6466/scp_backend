import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificationType } from '../../entities/certification-type.entity';
import { CertificationTypesController } from './certification-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CertificationType])],
  controllers: [CertificationTypesController],
})
export class CertificationTypesModule {}


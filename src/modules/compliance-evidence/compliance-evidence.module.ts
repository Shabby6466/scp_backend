import { Module } from '@nestjs/common';
import { ComplianceEvidenceController } from './compliance-evidence.controller';

@Module({
  controllers: [ComplianceEvidenceController],
})
export class ComplianceEvidenceModule {}


import { Module } from '@nestjs/common';
import { UserConsentController } from './user-consent.controller';

@Module({
  controllers: [UserConsentController],
})
export class UserConsentModule {}


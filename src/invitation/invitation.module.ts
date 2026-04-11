import { Module } from '@nestjs/common';
import { InvitationController } from './invitation.controller.js';
import { InvitationService } from './invitation.service.js';
import { MailerModule } from '../mailer/index.js';

@Module({
  imports: [MailerModule],
  controllers: [InvitationController],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationModule {}

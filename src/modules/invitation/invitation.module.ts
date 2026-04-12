import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { Invitation } from '../../entities/invitation.entity';
import { SchoolModule } from '../school/school.module';
import { BranchModule } from '../branch/branch.module';
import { UserModule } from '../user/user.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation]),
    forwardRef(() => SchoolModule),
    forwardRef(() => BranchModule),
    forwardRef(() => UserModule),
    MailerModule,
  ],
  controllers: [InvitationController],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationModule { }

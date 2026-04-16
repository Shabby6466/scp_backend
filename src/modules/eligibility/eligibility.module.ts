import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherEligibilityProfile } from '../../entities/teacher-eligibility-profile.entity';
import { EligibilityController } from './eligibility.controller';
import { EligibilityService } from './eligibility.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeacherEligibilityProfile]),
    forwardRef(() => UserModule),
  ],
  controllers: [EligibilityController],
  providers: [EligibilityService],
  exports: [EligibilityService],
})
export class EligibilityModule {}


import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentParentService } from './student-parent.service';
import { StudentParentController } from './student-parent.controller';
import { StudentProfileController } from './student-profile.controller';
import { StudentParent } from '../../entities/student-parent.entity';
import { StudentProfile } from '../../entities/student-profile.entity';
import { DocumentType } from '../../entities/document.entity';
import { UserModule } from '../user/user.module';
import { StudentProfileService } from './student-profile.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentParent, StudentProfile, DocumentType]),
    forwardRef(() => UserModule),
  ],
  controllers: [StudentParentController, StudentProfileController],
  providers: [StudentParentService, StudentProfileService],
  exports: [StudentParentService, StudentProfileService],
})
export class StudentParentModule { }

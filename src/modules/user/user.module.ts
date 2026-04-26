import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from '../../entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';
import { SchoolModule } from '../school/school.module';
import { BranchModule } from '../branch/branch.module';
import { TeacherProfile } from '../../entities/teacher-profile.entity';
import { TeacherPosition } from '../../entities/teacher-position.entity';
import { StudentProfile } from '../../entities/student-profile.entity';
import { StudentParent } from '../../entities/student-parent.entity';
import { TeacherController } from './teacher.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      TeacherProfile,
      TeacherPosition,
      StudentProfile,
      StudentParent,
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => SchoolModule),
    forwardRef(() => BranchModule),
    SettingsModule,
  ],
  controllers: [UserController, TeacherController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }

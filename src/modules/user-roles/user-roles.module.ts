import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Branch } from '../../entities/branch.entity';
import { TeacherProfile } from '../../entities/teacher-profile.entity';
import { UserRolesController } from './user-roles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Branch, TeacherProfile])],
  controllers: [UserRolesController],
})
export class UserRolesModule {}


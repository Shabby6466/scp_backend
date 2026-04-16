import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { StudentProfile } from '../../entities/student-profile.entity';
import { StudentParent } from '../../entities/student-parent.entity';
import { User } from '../../entities/user.entity';
import { Branch } from '../../entities/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentProfile, StudentParent, User, Branch])],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}


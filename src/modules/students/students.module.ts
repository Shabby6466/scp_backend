import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { StudentProfile } from '../../entities/student-profile.entity';
import { User } from '../../entities/user.entity';
import { Branch } from '../../entities/branch.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentProfile, User, Branch]),
    forwardRef(() => UserModule),
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}


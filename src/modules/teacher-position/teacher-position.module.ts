import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherPosition } from '../../entities/teacher-position.entity';
import { TeacherPositionController } from './teacher-position.controller';
import { TeacherPositionService } from './teacher-position.service';
import { BranchModule } from '../branch/branch.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeacherPosition]),
    forwardRef(() => BranchModule),
  ],
  controllers: [TeacherPositionController],
  providers: [TeacherPositionService],
  exports: [TeacherPositionService],
})
export class TeacherPositionModule {}


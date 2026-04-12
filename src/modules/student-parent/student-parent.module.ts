import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentParentService } from './student-parent.service';
import { StudentParentController } from './student-parent.controller';
import { StudentParent } from '../../entities/student-parent.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentParent]),
    forwardRef(() => UserModule),
  ],
  controllers: [StudentParentController],
  providers: [StudentParentService],
  exports: [StudentParentService],
})
export class StudentParentModule { }

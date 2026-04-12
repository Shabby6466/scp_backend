import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { Document } from '../../entities/document.entity';
import { UserModule } from '../user/user.module';
import { BranchModule } from '../branch/branch.module';
import { DocumentTypeModule } from '../document-type/document-type.module';
import { StorageModule } from '../storage/storage.module';
import { MailerModule } from '../mailer/mailer.module';
import { StudentParentModule } from '../student-parent/student-parent.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    forwardRef(() => UserModule),
    forwardRef(() => BranchModule),
    forwardRef(() => DocumentTypeModule),
    forwardRef(() => StudentParentModule),
    StorageModule,
    MailerModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule { }

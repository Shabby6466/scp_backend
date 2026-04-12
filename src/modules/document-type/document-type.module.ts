import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentTypeService } from './document-type.service';
import { DocumentTypeController } from './document-type.controller';
import { DocumentType } from '../../entities/document.entity';
import { UserModule } from '../user/user.module';
import { ComplianceCategoryModule } from '../compliance-category/compliance-category.module';
import { BranchModule } from '../branch/branch.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentType]),
    forwardRef(() => UserModule),
    forwardRef(() => ComplianceCategoryModule),
    forwardRef(() => BranchModule),
    MailerModule,
  ],
  controllers: [DocumentTypeController],
  providers: [DocumentTypeService],
  exports: [DocumentTypeService],
})
export class DocumentTypeModule { }

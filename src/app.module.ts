import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/index.js';
import { MailerModule } from './mailer/index.js';
import { StorageModule } from './storage/index.js';
import { AuthModule } from './auth/index.js';
import { SchoolModule } from './school/index.js';
import { UserModule } from './user/index.js';
import { BranchModule } from './branch/branch.module.js';
import { DocumentTypeModule } from './document-type/document-type.module.js';
import { DocumentModule } from './document/index.js';
import { SettingsModule } from './settings/index.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { ComplianceCategoryModule } from './compliance-category/compliance-category.module.js';
import { InvitationModule } from './invitation/invitation.module.js';
import { StudentParentModule } from './student-parent/student-parent.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Prefer backend/.env when you run `npm run dev` from SchoolCompliance/backend
      envFilePath: ['.env', '../../.env', '../../../.env'],
    }),
    PrismaModule,
    MailerModule,
    StorageModule,
    AuthModule,
    SchoolModule,
    UserModule,
    BranchModule,
    DocumentTypeModule,
    DocumentModule,
    SettingsModule,
    AnalyticsModule,
    ComplianceCategoryModule,
    InvitationModule,
    StudentParentModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { AppService } from './app.service';
import { SeederService } from '../common/seeder.service';
import { User } from '../../entities/user.entity';
import { AppConfig } from '../../entities/app-config.entity';

import { MailerModule } from '../mailer';
import { StorageModule } from '../storage';
import { AuthModule } from '../auth';
import { SchoolModule } from '../school';
import { UserModule } from '../user';
import { BranchModule } from '../branch/branch.module';
import { DocumentTypeModule } from '../document-type/document-type.module';
import { DocumentModule } from '../document';
import { SettingsModule } from '../settings';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ComplianceCategoryModule } from '../compliance-category/compliance-category.module';
import { InvitationModule } from '../invitation/invitation.module';
import { StudentParentModule } from '../student-parent/student-parent.module';

export const imports = [
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
];

export const adminModulesImports = [
  SchoolModule,
  UserModule,
  BranchModule,
  SettingsModule,
  AnalyticsModule,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: AppService.envConfiguration(),
    }),
    WinstonModule.forRoot(AppService.createWinstonTransports()),
    TypeOrmModule.forRoot(AppService.typeormConfig()),
    TypeOrmModule.forFeature([User, AppConfig]),
    ...imports,
  ],
  providers: [AppService, SeederService],
})
export class AppModule { }

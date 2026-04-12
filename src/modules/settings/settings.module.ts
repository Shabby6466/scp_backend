import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { AppConfig } from '../../entities/app-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AppConfig])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule { }

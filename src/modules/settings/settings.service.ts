import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfig } from '../../entities/app-config.entity';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';

export interface AppSettingsPublic {
  otpEmailVerificationEnabled: boolean;
  selfRegistrationEnabled: boolean;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppConfig)
    private readonly appConfigRepository: Repository<AppConfig>,
  ) { }

  async ensureDefault() {
    let row = await this.appConfigRepository.findOne({ where: {} });
    if (!row) {
      row = this.appConfigRepository.create({
        otpEmailVerificationEnabled: true,
        selfRegistrationEnabled: true,
      });
      await this.appConfigRepository.save(row);
    }
    return row;
  }

  async getPublic(): Promise<AppSettingsPublic> {
    const row = await this.ensureDefault();
    return {
      otpEmailVerificationEnabled: row.otpEmailVerificationEnabled,
      selfRegistrationEnabled: row.selfRegistrationEnabled,
    };
  }

  async update(dto: UpdateAppSettingsDto): Promise<AppSettingsPublic> {
    let row = await this.ensureDefault();

    if (dto.otpEmailVerificationEnabled !== undefined) {
      row.otpEmailVerificationEnabled = dto.otpEmailVerificationEnabled;
    }
    if (dto.selfRegistrationEnabled !== undefined) {
      row.selfRegistrationEnabled = dto.selfRegistrationEnabled;
    }

    row = await this.appConfigRepository.save(row);

    return {
      otpEmailVerificationEnabled: row.otpEmailVerificationEnabled,
      selfRegistrationEnabled: row.selfRegistrationEnabled,
    };
  }
}

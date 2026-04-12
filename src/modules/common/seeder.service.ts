import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { AppConfig } from '../../entities/app-config.entity';
import { UserRole } from '../common/enums/database.enum';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AppConfig)
    private readonly configRepository: Repository<AppConfig>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
    await this.seedAppConfig();
  }

  private async seedAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      this.logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set in env — skipping admin seed.');
      return;
    }

    const existing = await this.userRepository.findOne({
      where: { email: adminEmail.toLowerCase() },
    });

    if (existing) {
      this.logger.log(`Platform admin already exists (${adminEmail}).`);
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const admin = this.userRepository.create({
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      name: 'Platform Admin',
      role: UserRole.ADMIN,
      authorities: [UserRole.ADMIN],
      emailVerifiedAt: new Date(),
    });

    await this.userRepository.save(admin);
    this.logger.log(`Platform admin created: ${adminEmail}`);
  }

  private async seedAppConfig() {
    const existing = await this.configRepository.findOne({ where: {} });

    if (existing) {
      this.logger.log('App config already exists — skipping.');
      return;
    }

    const config = this.configRepository.create({
      otpEmailVerificationEnabled: true,
      selfRegistrationEnabled: true,
    });

    await this.configRepository.save(config);
    this.logger.log('Default app config seeded.');
  }
}

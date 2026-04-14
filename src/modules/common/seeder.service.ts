import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { AppConfig } from '../../entities/app-config.entity';
import { UserRole } from '../common/enums/database.enum';
import { buildDemoSeedRepositories, seedDemoData } from './demo-seed.util';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
    await this.seedAppConfig();
    await seedDemoData(
      buildDemoSeedRepositories(this.dataSource),
      this.logger,
    );
  }

  private async seedAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      this.logger.warn(
        'ADMIN_EMAIL or ADMIN_PASSWORD not set in env — skipping admin seed.',
      );
      return;
    }

    const users = this.dataSource.getRepository(User);
    const existing = await users.findOne({
      where: { email: adminEmail.toLowerCase() },
    });

    if (existing) {
      this.logger.log(`Platform admin already exists (${adminEmail}).`);
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const admin = users.create({
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      name: 'Platform Admin',
      role: UserRole.ADMIN,
      authorities: [UserRole.ADMIN],
      emailVerifiedAt: new Date(),
    });

    await users.save(admin);
    this.logger.log(`Platform admin created: ${adminEmail}`);
  }

  private async seedAppConfig() {
    const configs = this.dataSource.getRepository(AppConfig);
    const existing = await configs.findOne({ where: {} });

    if (existing) {
      this.logger.log('App config already exists — skipping.');
      return;
    }

    const config = configs.create({
      otpEmailVerificationEnabled: true,
      selfRegistrationEnabled: true,
    });

    await configs.save(config);
    this.logger.log('Default app config seeded.');
  }
}

import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { User } from '../entities/user.entity';
import { AppConfig } from '../entities/app-config.entity';
import { UserRole } from '../modules/common/enums/database.enum';
import * as bcrypt from 'bcryptjs';
import {
  buildDemoSeedRepositories,
  seedDemoData,
} from '../modules/common/demo-seed.util';

dotenv.config();

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [join(__dirname, '../entities/*.entity{.ts,.js}')],
    // Match app: use DB_SYNC=true in .env so an empty DB gets tables before inserts.
    synchronize: process.env.DB_SYNC === 'true',
  });

  try {
    await dataSource.initialize();
    console.log('Database connected.');

    const users = dataSource.getRepository(User);
    const configs = dataSource.getRepository(AppConfig);

    const adminEmail = (
      process.env.ADMIN_EMAIL || 'admin@schoolcompliance.com'
    ).toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    let admin = await users.findOne({
      where: { email: adminEmail },
    });

    if (!admin) {
      console.log('Creating platform admin...');
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      admin = users.create({
        email: adminEmail,
        password: hashedPassword,
        name: 'Platform Admin',
        role: UserRole.ADMIN,
        authorities: [UserRole.ADMIN],
        emailVerifiedAt: new Date(),
      });
      await users.save(admin);
      console.log('Platform admin created.');
    } else {
      console.log('Platform admin already exists.');
    }

    const existingConfig = await configs.findOne({ where: {} });
    if (!existingConfig) {
      console.log('Creating app config...');
      await configs.save(
        configs.create({
          otpEmailVerificationEnabled: true,
          selfRegistrationEnabled: true,
        }),
      );
      console.log('App config created.');
    } else {
      console.log('App config already exists.');
    }

    await seedDemoData(buildDemoSeedRepositories(dataSource), console);

    console.log('Seeding finished.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}

void seed();

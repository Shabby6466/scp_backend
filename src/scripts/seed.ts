import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { AppConfig } from '../entities/app-config.entity';
import { UserRole } from '../modules/common/enums/database.enum';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, AppConfig], // Add all entities here or use a glob if needed
  synchronize: false,
});

async function seed() {
  try {
    await dataSource.initialize();
    console.log('Data Source has been initialized!');

    const userRepository = dataSource.getRepository(User);
    const configRepository = dataSource.getRepository(AppConfig);

    // 1. Seed Platform Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@schoolcompliance.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    const existingAdmin = await userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      console.log('Creating platform admin...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        name: 'Platform Admin',
        role: UserRole.ADMIN,
        authorities: [UserRole.ADMIN],
      });
      await userRepository.save(admin);
      console.log('Platform admin created successfully.');
    } else {
      console.log('Platform admin already exists.');
    }

    // 2. Seed Default AppConfig
    const existingConfig = await configRepository.findOne({
      where: {}, // Just check if any config exists
    });

    if (!existingConfig) {
      console.log('Creating initial app config...');
      const config = configRepository.create({
        otpEmailVerificationEnabled: true,
        selfRegistrationEnabled: true,
      });
      await configRepository.save(config);
      console.log('App config created successfully.');
    } else {
      console.log('App config already exists.');
    }

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await dataSource.destroy();
  }
}

seed();

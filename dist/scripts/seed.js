"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const app_config_entity_1 = require("../entities/app-config.entity");
const database_enum_1 = require("../modules/common/enums/database.enum");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();
const dataSource = new typeorm_1.DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [user_entity_1.User, app_config_entity_1.AppConfig],
    synchronize: false,
});
async function seed() {
    try {
        await dataSource.initialize();
        console.log('Data Source has been initialized!');
        const userRepository = dataSource.getRepository(user_entity_1.User);
        const configRepository = dataSource.getRepository(app_config_entity_1.AppConfig);
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
                role: database_enum_1.UserRole.ADMIN,
                authorities: [database_enum_1.UserRole.ADMIN],
            });
            await userRepository.save(admin);
            console.log('Platform admin created successfully.');
        }
        else {
            console.log('Platform admin already exists.');
        }
        const existingConfig = await configRepository.findOne({
            where: {},
        });
        if (!existingConfig) {
            console.log('Creating initial app config...');
            const config = configRepository.create({
                otpEmailVerificationEnabled: true,
                selfRegistrationEnabled: true,
            });
            await configRepository.save(config);
            console.log('App config created successfully.');
        }
        else {
            console.log('App config already exists.');
        }
        console.log('Seeding completed successfully.');
    }
    catch (error) {
        console.error('Error during seeding:', error);
    }
    finally {
        await dataSource.destroy();
    }
}
seed();
//# sourceMappingURL=seed.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const path_1 = require("path");
const dotenv = require("dotenv");
const user_entity_1 = require("../entities/user.entity");
const app_config_entity_1 = require("../entities/app-config.entity");
const database_enum_1 = require("../modules/common/enums/database.enum");
const bcrypt = require("bcryptjs");
const demo_seed_util_1 = require("../modules/common/demo-seed.util");
dotenv.config();
async function seed() {
    const dataSource = new typeorm_1.DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [(0, path_1.join)(__dirname, '../entities/*.entity{.ts,.js}')],
        synchronize: process.env.DB_SYNC === 'true',
    });
    try {
        await dataSource.initialize();
        console.log('Database connected.');
        const users = dataSource.getRepository(user_entity_1.User);
        const configs = dataSource.getRepository(app_config_entity_1.AppConfig);
        const adminEmail = (process.env.ADMIN_EMAIL || 'admin@schoolcompliance.com').toLowerCase();
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
                role: database_enum_1.UserRole.ADMIN,
                authorities: [database_enum_1.UserRole.ADMIN],
                emailVerifiedAt: new Date(),
            });
            await users.save(admin);
            console.log('Platform admin created.');
        }
        else {
            console.log('Platform admin already exists.');
        }
        const existingConfig = await configs.findOne({ where: {} });
        if (!existingConfig) {
            console.log('Creating app config...');
            await configs.save(configs.create({
                otpEmailVerificationEnabled: true,
                selfRegistrationEnabled: true,
            }));
            console.log('App config created.');
        }
        else {
            console.log('App config already exists.');
        }
        await (0, demo_seed_util_1.seedDemoData)((0, demo_seed_util_1.buildDemoSeedRepositories)(dataSource), console);
        console.log('Seeding finished.');
    }
    catch (error) {
        console.error('Seeding failed:', error);
        process.exitCode = 1;
    }
    finally {
        await dataSource.destroy();
    }
}
void seed();
//# sourceMappingURL=seed.js.map
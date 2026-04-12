"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SeederService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeederService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("../../entities/user.entity");
const app_config_entity_1 = require("../../entities/app-config.entity");
const database_enum_1 = require("../common/enums/database.enum");
let SeederService = SeederService_1 = class SeederService {
    constructor(userRepository, configRepository) {
        this.userRepository = userRepository;
        this.configRepository = configRepository;
        this.logger = new common_1.Logger(SeederService_1.name);
    }
    async onApplicationBootstrap() {
        await this.seedAdmin();
        await this.seedAppConfig();
    }
    async seedAdmin() {
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
            role: database_enum_1.UserRole.ADMIN,
            authorities: [database_enum_1.UserRole.ADMIN],
            emailVerifiedAt: new Date(),
        });
        await this.userRepository.save(admin);
        this.logger.log(`Platform admin created: ${adminEmail}`);
    }
    async seedAppConfig() {
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
};
exports.SeederService = SeederService;
exports.SeederService = SeederService = SeederService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(app_config_entity_1.AppConfig)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SeederService);
//# sourceMappingURL=seeder.service.js.map
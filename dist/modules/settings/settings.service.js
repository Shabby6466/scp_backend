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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const app_config_entity_1 = require("../../entities/app-config.entity");
let SettingsService = class SettingsService {
    constructor(appConfigRepository) {
        this.appConfigRepository = appConfigRepository;
    }
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
    async getPublic() {
        const row = await this.ensureDefault();
        return {
            otpEmailVerificationEnabled: row.otpEmailVerificationEnabled,
            selfRegistrationEnabled: row.selfRegistrationEnabled,
        };
    }
    async update(dto) {
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
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(app_config_entity_1.AppConfig)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SettingsService);
//# sourceMappingURL=settings.service.js.map
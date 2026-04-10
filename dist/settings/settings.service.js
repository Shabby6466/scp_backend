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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
let SettingsService = class SettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureDefault() {
        const row = await this.prisma.appConfig.upsert({
            where: { id: 'default' },
            create: {
                id: 'default',
                otpEmailVerificationEnabled: true,
                selfRegistrationEnabled: true,
            },
            update: {},
        });
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
        await this.ensureDefault();
        const row = await this.prisma.appConfig.update({
            where: { id: 'default' },
            data: {
                ...(dto.otpEmailVerificationEnabled !== undefined && {
                    otpEmailVerificationEnabled: dto.otpEmailVerificationEnabled,
                }),
                ...(dto.selfRegistrationEnabled !== undefined && {
                    selfRegistrationEnabled: dto.selfRegistrationEnabled,
                }),
            },
        });
        return {
            otpEmailVerificationEnabled: row.otpEmailVerificationEnabled,
            selfRegistrationEnabled: row.selfRegistrationEnabled,
        };
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map
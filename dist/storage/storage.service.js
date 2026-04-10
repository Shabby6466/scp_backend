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
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_crypto_1 = require("node:crypto");
const s3_storage_driver_js_1 = require("./s3-storage.driver.js");
const supabase_storage_driver_js_1 = require("./supabase-storage.driver.js");
let StorageService = class StorageService {
    config;
    driver;
    constructor(config) {
        this.config = config;
        const provider = (this.config.get('STORAGE_PROVIDER') ?? 'supabase').toLowerCase();
        this.driver =
            provider === 's3'
                ? new s3_storage_driver_js_1.S3StorageDriver(this.config)
                : new supabase_storage_driver_js_1.SupabaseStorageDriver(this.config);
    }
    buildDocumentKey(schoolId, branchId, category, entityId, fileName) {
        const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uuid = (0, node_crypto_1.randomUUID)();
        return `schools/${schoolId}/branches/${branchId}/${category}/${entityId}/${uuid}-${safeName}`;
    }
    isConfigured() {
        return this.driver.isConfigured();
    }
    async createPresignedUploadUrl(key, contentType, expiresInSeconds = 900) {
        return this.driver.createPresignedUploadUrl(key, contentType, expiresInSeconds);
    }
    async createPresignedDownloadUrl(key, expiresInSeconds = 3600) {
        return this.driver.createPresignedDownloadUrl(key, expiresInSeconds);
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map
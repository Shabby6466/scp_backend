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
exports.AuthOtp = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
let AuthOtp = class AuthOtp extends base_entity_1.BaseEntity {
};
exports.AuthOtp = AuthOtp;
__decorate([
    (0, typeorm_1.Column)({ name: 'email',
        type: 'varchar'
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], AuthOtp.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'code_hash',
        type: 'varchar'
    }),
    __metadata("design:type", String)
], AuthOtp.prototype, "codeHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'timestamp' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], AuthOtp.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'consumed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], AuthOtp.prototype, "consumedAt", void 0);
exports.AuthOtp = AuthOtp = __decorate([
    (0, typeorm_1.Entity)('AuthOtp')
], AuthOtp);
//# sourceMappingURL=auth-otp.entity.js.map
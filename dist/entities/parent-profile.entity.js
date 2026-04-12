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
exports.ParentProfile = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const user_entity_1 = require("./user.entity");
let ParentProfile = class ParentProfile extends base_entity_1.BaseEntity {
};
exports.ParentProfile = ParentProfile;
__decorate([
    (0, typeorm_1.Column)({ name: 'phone', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], ParentProfile.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ParentProfile.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notes', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ParentProfile.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.parentProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], ParentProfile.prototype, "user", void 0);
exports.ParentProfile = ParentProfile = __decorate([
    (0, typeorm_1.Entity)('ParentProfile')
], ParentProfile);
//# sourceMappingURL=parent-profile.entity.js.map
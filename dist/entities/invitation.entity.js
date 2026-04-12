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
exports.Invitation = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const database_enum_1 = require("../modules/common/enums/database.enum");
const school_entity_1 = require("./school.entity");
const branch_entity_1 = require("./branch.entity");
const user_entity_1 = require("./user.entity");
let Invitation = class Invitation extends base_entity_1.BaseEntity {
};
exports.Invitation = Invitation;
__decorate([
    (0, typeorm_1.Column)({ name: 'email',
        type: 'varchar'
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Invitation.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'role', type: 'enum', enum: database_enum_1.UserRole }),
    __metadata("design:type", String)
], Invitation.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'token', unique: true,
        type: 'varchar'
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Invitation.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'enum', enum: database_enum_1.InvitationStatus, default: database_enum_1.InvitationStatus.PENDING }),
    __metadata("design:type", String)
], Invitation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], Invitation.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'accepted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Invitation.prototype, "acceptedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'school_id', type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Invitation.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'branch_id', nullable: true, type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Object)
], Invitation.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sent_by_id', type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Invitation.prototype, "sentById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => school_entity_1.School, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", school_entity_1.School)
], Invitation.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => branch_entity_1.Branch, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'branch_id' }),
    __metadata("design:type", branch_entity_1.Branch)
], Invitation.prototype, "branch", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sent_by_id' }),
    __metadata("design:type", user_entity_1.User)
], Invitation.prototype, "sentBy", void 0);
exports.Invitation = Invitation = __decorate([
    (0, typeorm_1.Entity)('Invitation')
], Invitation);
//# sourceMappingURL=invitation.entity.js.map
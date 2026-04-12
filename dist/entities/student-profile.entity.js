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
exports.StudentProfile = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const user_entity_1 = require("./user.entity");
let StudentProfile = class StudentProfile extends base_entity_1.BaseEntity {
};
exports.StudentProfile = StudentProfile;
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', unique: true,
        type: 'varchar'
    }),
    __metadata("design:type", String)
], StudentProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'first_name', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_name', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date_of_birth', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "dateOfBirth", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'grade_level', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "gradeLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'roll_number', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "rollNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'guardian_name', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "guardianName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'guardian_phone', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "guardianPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_by', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "deletedBy", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.studentProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], StudentProfile.prototype, "user", void 0);
exports.StudentProfile = StudentProfile = __decorate([
    (0, typeorm_1.Entity)('StudentProfile')
], StudentProfile);
//# sourceMappingURL=student-profile.entity.js.map
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
exports.TeacherProfile = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const user_entity_1 = require("./user.entity");
const teacher_position_entity_1 = require("./teacher-position.entity");
const database_enum_1 = require("../modules/common/enums/database.enum");
let TeacherProfile = class TeacherProfile extends base_entity_1.BaseEntity {
};
exports.TeacherProfile = TeacherProfile;
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', unique: true,
        type: 'varchar'
    }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'subject_area', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "subjectArea", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'employee_code', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "employeeCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'joining_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "joiningDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'phone', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hire_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "hireDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'employment_status',
        type: 'enum',
        enum: database_enum_1.EmploymentStatus,
        default: database_enum_1.EmploymentStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "employmentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'certification_type', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "certificationType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'certification_expiry', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "certificationExpiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'background_check_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "backgroundCheckDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'background_check_expiry', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "backgroundCheckExpiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'position_id', nullable: true, type: 'varchar' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "positionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notes', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.teacherProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], TeacherProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_position_entity_1.TeacherPosition, (position) => position.teachers, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'position_id' }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "position", void 0);
exports.TeacherProfile = TeacherProfile = __decorate([
    (0, typeorm_1.Entity)('TeacherProfile')
], TeacherProfile);
//# sourceMappingURL=teacher-profile.entity.js.map
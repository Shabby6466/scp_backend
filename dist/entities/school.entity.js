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
exports.School = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
let School = class School extends base_entity_1.BaseEntity {
};
exports.School = School;
__decorate([
    (0, typeorm_1.Column)({
        name: 'name',
        type: 'varchar'
    }),
    __metadata("design:type", String)
], School.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'email', nullable: true,
        type: 'varchar'
    }),
    __metadata("design:type", Object)
], School.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'phone', nullable: true,
        type: 'varchar'
    }),
    __metadata("design:type", Object)
], School.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'address', nullable: true,
        type: 'varchar'
    }),
    __metadata("design:type", Object)
], School.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'city', nullable: true,
        type: 'varchar'
    }),
    __metadata("design:type", Object)
], School.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'state', nullable: true,
        type: 'varchar'
    }),
    __metadata("design:type", Object)
], School.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'zip_code', nullable: true,
        type: 'varchar'
    }),
    __metadata("design:type", Object)
], School.prototype, "zipCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'website', nullable: true,
        type: 'varchar'
    }),
    __metadata("design:type", Object)
], School.prototype, "website", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'license_number', nullable: true,
        type: 'varchar'
    }),
    __metadata("design:type", Object)
], School.prototype, "licenseNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'certification_number', nullable: true,
        type: 'varchar'
    }),
    __metadata("design:type", Object)
], School.prototype, "certificationNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'min_age', nullable: true,
        type: 'int'
    }),
    __metadata("design:type", Object)
], School.prototype, "minAge", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'max_age', nullable: true,
        type: 'int'
    }),
    __metadata("design:type", Object)
], School.prototype, "maxAge", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'total_capacity', nullable: true,
        type: 'int'
    }),
    __metadata("design:type", Object)
], School.prototype, "totalCapacity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'primary_color', nullable: true,
        type: 'varchar'
    }),
    __metadata("design:type", Object)
], School.prototype, "primaryColor", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'logo_url', nullable: true,
        type: 'varchar'
    }),
    __metadata("design:type", Object)
], School.prototype, "logoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'is_approved', default: false,
        type: 'boolean'
    }),
    __metadata("design:type", Boolean)
], School.prototype, "isApproved", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approved_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], School.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'approved_by', nullable: true,
        type: 'varchar'
    }),
    __metadata("design:type", Object)
], School.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'deleted_by', nullable: true,
        type: 'varchar'
    }),
    __metadata("design:type", Object)
], School.prototype, "deletedBy", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('User', (user) => user.school),
    __metadata("design:type", Array)
], School.prototype, "users", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Branch', (branch) => branch.school),
    __metadata("design:type", Array)
], School.prototype, "branches", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('ComplianceRequirement', (req) => req.school),
    __metadata("design:type", Array)
], School.prototype, "complianceRequirements", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('InspectionType', (type) => type.school),
    __metadata("design:type", Array)
], School.prototype, "inspectionTypes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('CertificationType', (type) => type.school),
    __metadata("design:type", Array)
], School.prototype, "certificationTypes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('TeacherPosition', (pos) => pos.school),
    __metadata("design:type", Array)
], School.prototype, "teacherPositions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('TeacherEligibilityProfile', (profile) => profile.school),
    __metadata("design:type", Array)
], School.prototype, "eligibilityProfiles", void 0);
exports.School = School = __decorate([
    (0, typeorm_1.Entity)('School')
], School);
//# sourceMappingURL=school.entity.js.map
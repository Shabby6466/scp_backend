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
exports.ComplianceRequirement = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const school_entity_1 = require("./school.entity");
const user_entity_1 = require("./user.entity");
const inspection_type_entity_1 = require("./inspection-type.entity");
let ComplianceRequirement = class ComplianceRequirement extends base_entity_1.BaseEntity {
};
exports.ComplianceRequirement = ComplianceRequirement;
__decorate([
    (0, typeorm_1.Column)({ name: 'school_id',
        type: 'varchar'
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ComplianceRequirement.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name',
        type: 'varchar'
    }),
    __metadata("design:type", String)
], ComplianceRequirement.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'description', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ComplianceRequirement.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'inspection_type_id', nullable: true, type: 'varchar' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Object)
], ComplianceRequirement.prototype, "inspectionTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', nullable: true, type: 'varchar' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Object)
], ComplianceRequirement.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by_id', nullable: true, type: 'varchar' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Object)
], ComplianceRequirement.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => school_entity_1.School, (school) => school.complianceRequirements, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", school_entity_1.School)
], ComplianceRequirement.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inspection_type_entity_1.InspectionType, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'inspection_type_id' }),
    __metadata("design:type", Object)
], ComplianceRequirement.prototype, "inspectionType", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", Object)
], ComplianceRequirement.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by_id' }),
    __metadata("design:type", Object)
], ComplianceRequirement.prototype, "createdBy", void 0);
exports.ComplianceRequirement = ComplianceRequirement = __decorate([
    (0, typeorm_1.Entity)('ComplianceRequirement')
], ComplianceRequirement);
//# sourceMappingURL=compliance-requirement.entity.js.map
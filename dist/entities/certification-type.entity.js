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
exports.CertificationType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const school_entity_1 = require("./school.entity");
let CertificationType = class CertificationType extends base_entity_1.BaseEntity {
};
exports.CertificationType = CertificationType;
__decorate([
    (0, typeorm_1.Column)({ name: 'school_id',
        type: 'varchar'
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], CertificationType.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name',
        type: 'varchar'
    }),
    __metadata("design:type", String)
], CertificationType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'description', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CertificationType.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_validity_months', nullable: true, type: 'int' }),
    __metadata("design:type", Object)
], CertificationType.prototype, "defaultValidityMonths", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('School', (school) => school.certificationTypes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", school_entity_1.School)
], CertificationType.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('CertificationRecord', (record) => record.certificationType),
    __metadata("design:type", Array)
], CertificationType.prototype, "certificationRecords", void 0);
exports.CertificationType = CertificationType = __decorate([
    (0, typeorm_1.Entity)('CertificationType')
], CertificationType);
//# sourceMappingURL=certification-type.entity.js.map
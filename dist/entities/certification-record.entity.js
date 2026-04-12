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
exports.CertificationRecord = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const school_entity_1 = require("./school.entity");
const certification_type_entity_1 = require("./certification-type.entity");
let CertificationRecord = class CertificationRecord extends base_entity_1.BaseEntity {
};
exports.CertificationRecord = CertificationRecord;
__decorate([
    (0, typeorm_1.Column)({ name: 'school_id',
        type: 'varchar'
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], CertificationRecord.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'certification_type_id',
        type: 'varchar'
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], CertificationRecord.prototype, "certificationTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'issue_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], CertificationRecord.prototype, "issueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expiry_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], CertificationRecord.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_number', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], CertificationRecord.prototype, "referenceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'document_url', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], CertificationRecord.prototype, "documentUrl", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('School', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", school_entity_1.School)
], CertificationRecord.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('CertificationType', (type) => type.certificationRecords, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'certification_type_id' }),
    __metadata("design:type", certification_type_entity_1.CertificationType)
], CertificationRecord.prototype, "certificationType", void 0);
exports.CertificationRecord = CertificationRecord = __decorate([
    (0, typeorm_1.Entity)('CertificationRecord')
], CertificationRecord);
//# sourceMappingURL=certification-record.entity.js.map
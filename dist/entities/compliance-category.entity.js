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
exports.ComplianceCategory = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const school_entity_1 = require("./school.entity");
const user_entity_1 = require("./user.entity");
const document_entity_1 = require("./document.entity");
let ComplianceCategory = class ComplianceCategory extends base_entity_1.BaseEntity {
};
exports.ComplianceCategory = ComplianceCategory;
__decorate([
    (0, typeorm_1.Column)({
        name: 'name',
        type: 'varchar'
    }),
    __metadata("design:type", String)
], ComplianceCategory.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'slug',
        type: 'varchar'
    }),
    __metadata("design:type", String)
], ComplianceCategory.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'description', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ComplianceCategory.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'icon', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], ComplianceCategory.prototype, "icon", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'sort_order', default: 0,
        type: 'int'
    }),
    __metadata("design:type", Number)
], ComplianceCategory.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'school_id',
        type: 'uuid'
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ComplianceCategory.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'created_by_id',
        type: 'uuid'
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ComplianceCategory.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => school_entity_1.School, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", school_entity_1.School)
], ComplianceCategory.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by_id' }),
    __metadata("design:type", user_entity_1.User)
], ComplianceCategory.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => document_entity_1.DocumentType, (type) => type.category),
    __metadata("design:type", Array)
], ComplianceCategory.prototype, "documentTypes", void 0);
exports.ComplianceCategory = ComplianceCategory = __decorate([
    (0, typeorm_1.Entity)('ComplianceCategory'),
    (0, typeorm_1.Unique)(['schoolId', 'slug'])
], ComplianceCategory);
//# sourceMappingURL=compliance-category.entity.js.map
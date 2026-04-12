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
exports.Document = exports.DocumentType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const database_enum_1 = require("../modules/common/enums/database.enum");
const user_entity_1 = require("./user.entity");
const compliance_category_entity_1 = require("./compliance-category.entity");
let DocumentType = class DocumentType extends base_entity_1.BaseEntity {
};
exports.DocumentType = DocumentType;
__decorate([
    (0, typeorm_1.Column)({ name: 'name',
        type: 'varchar'
    }),
    __metadata("design:type", String)
], DocumentType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_role', type: 'enum', enum: database_enum_1.UserRole }),
    __metadata("design:type", String)
], DocumentType.prototype, "targetRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_mandatory', default: false,
        type: 'boolean'
    }),
    __metadata("design:type", Boolean)
], DocumentType.prototype, "isMandatory", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'renewal_period', type: 'enum', enum: database_enum_1.RenewalPeriod, default: database_enum_1.RenewalPeriod.NONE }),
    __metadata("design:type", String)
], DocumentType.prototype, "renewalPeriod", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', default: 0,
        type: 'int'
    }),
    __metadata("design:type", Number)
], DocumentType.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'school_id', nullable: true, type: 'varchar' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Object)
], DocumentType.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'branch_id', nullable: true, type: 'varchar' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Object)
], DocumentType.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by_id', nullable: true, type: 'varchar' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Object)
], DocumentType.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id', nullable: true, type: 'varchar' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Object)
], DocumentType.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => compliance_category_entity_1.ComplianceCategory, (cat) => cat.documentTypes, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", Object)
], DocumentType.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Document, (doc) => doc.documentType),
    __metadata("design:type", Array)
], DocumentType.prototype, "documents", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => user_entity_1.User, (user) => user.id),
    (0, typeorm_1.JoinTable)({
        name: 'UserRequiredDocumentType',
        joinColumn: { name: 'document_type_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], DocumentType.prototype, "requiredUsers", void 0);
exports.DocumentType = DocumentType = __decorate([
    (0, typeorm_1.Entity)('DocumentType')
], DocumentType);
let Document = class Document extends base_entity_1.BaseEntity {
};
exports.Document = Document;
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_user_id',
        type: 'varchar'
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Document.prototype, "ownerUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'document_type_id',
        type: 'varchar'
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Document.prototype, "documentTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_name',
        type: 'varchar'
    }),
    __metadata("design:type", String)
], Document.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 's3_key',
        type: 'varchar'
    }),
    __metadata("design:type", String)
], Document.prototype, "s3Key", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mime_type', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], Document.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'size_bytes', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Document.prototype, "sizeBytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'issued_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Document.prototype, "issuedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Document.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verified_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Document.prototype, "verifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by_user_id',
        type: 'varchar'
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Document.prototype, "uploadedByUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'owner_user_id' }),
    __metadata("design:type", user_entity_1.User)
], Document.prototype, "ownerUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => DocumentType, (type) => type.documents, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'document_type_id' }),
    __metadata("design:type", DocumentType)
], Document.prototype, "documentType", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'uploaded_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], Document.prototype, "uploadedBy", void 0);
exports.Document = Document = __decorate([
    (0, typeorm_1.Entity)('Document')
], Document);
//# sourceMappingURL=document.entity.js.map
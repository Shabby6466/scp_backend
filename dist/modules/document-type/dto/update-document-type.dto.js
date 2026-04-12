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
exports.UpdateDocumentTypeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const database_enum_1 = require("../../common/enums/database.enum");
class UpdateDocumentTypeDto {
}
exports.UpdateDocumentTypeDto = UpdateDocumentTypeDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Updated Document Name', description: 'Updated name of the document type' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDocumentTypeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: database_enum_1.RenewalPeriod, example: database_enum_1.RenewalPeriod.BIENNIAL, description: 'Updated renewal period' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(database_enum_1.RenewalPeriod),
    __metadata("design:type", String)
], UpdateDocumentTypeDto.prototype, "renewalPeriod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true, description: 'Whether the document is mandatory' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateDocumentTypeDto.prototype, "isMandatory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: database_enum_1.UserRole, example: database_enum_1.UserRole.TEACHER, description: 'Updated target role' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(database_enum_1.UserRole),
    __metadata("design:type", String)
], UpdateDocumentTypeDto.prototype, "targetRole", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-of-category', description: 'Updated compliance category ID (null to clear)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateDocumentTypeDto.prototype, "complianceCategoryId", void 0);
//# sourceMappingURL=update-document-type.dto.js.map
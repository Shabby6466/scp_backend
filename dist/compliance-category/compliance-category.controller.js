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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceCategoryController = void 0;
const common_1 = require("@nestjs/common");
const compliance_category_service_js_1 = require("./compliance-category.service.js");
const jwt_auth_guard_js_1 = require("../auth/guards/jwt-auth.guard.js");
const current_user_decorator_js_1 = require("../auth/decorators/current-user.decorator.js");
const create_compliance_category_dto_js_1 = require("./dto/create-compliance-category.dto.js");
const update_compliance_category_dto_js_1 = require("./dto/update-compliance-category.dto.js");
let ComplianceCategoryController = class ComplianceCategoryController {
    complianceCategoryService;
    constructor(complianceCategoryService) {
        this.complianceCategoryService = complianceCategoryService;
    }
    create(user, dto) {
        return this.complianceCategoryService.create(dto, user);
    }
    findAll(user, schoolId) {
        return this.complianceCategoryService.findAll(user, schoolId);
    }
    findBySlug(slug, user) {
        return this.complianceCategoryService.findBySlug(slug, user);
    }
    findOne(id, user) {
        return this.complianceCategoryService.findOne(id, user);
    }
    getScore(id, user) {
        return this.complianceCategoryService.getScore(id, user);
    }
    update(id, dto, user) {
        return this.complianceCategoryService.update(id, dto, user);
    }
    delete(id, user) {
        return this.complianceCategoryService.delete(id, user);
    }
};
exports.ComplianceCategoryController = ComplianceCategoryController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_compliance_category_dto_js_1.CreateComplianceCategoryDto]),
    __metadata("design:returntype", void 0)
], ComplianceCategoryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('schoolId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ComplianceCategoryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('by-slug/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ComplianceCategoryController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ComplianceCategoryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/score'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ComplianceCategoryController.prototype, "getScore", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_compliance_category_dto_js_1.UpdateComplianceCategoryDto, Object]),
    __metadata("design:returntype", void 0)
], ComplianceCategoryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ComplianceCategoryController.prototype, "delete", null);
exports.ComplianceCategoryController = ComplianceCategoryController = __decorate([
    (0, common_1.Controller)('compliance-categories'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __metadata("design:paramtypes", [compliance_category_service_js_1.ComplianceCategoryService])
], ComplianceCategoryController);
//# sourceMappingURL=compliance-category.controller.js.map
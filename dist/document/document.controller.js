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
exports.DocumentController = void 0;
const common_1 = require("@nestjs/common");
const document_service_js_1 = require("./document.service.js");
const jwt_auth_guard_js_1 = require("../auth/guards/jwt-auth.guard.js");
const current_user_decorator_js_1 = require("../auth/decorators/current-user.decorator.js");
const presign_dto_js_1 = require("./dto/presign.dto.js");
const complete_dto_js_1 = require("./dto/complete.dto.js");
const search_document_dto_js_1 = require("./dto/search-document.dto.js");
const roles_guard_js_1 = require("../auth/guards/roles.guard.js");
const roles_decorator_js_1 = require("../auth/decorators/roles.decorator.js");
const client_1 = require("@prisma/client");
let DocumentController = class DocumentController {
    documentService;
    constructor(documentService) {
        this.documentService = documentService;
    }
    searchDocuments(dto, user) {
        return this.documentService.searchDocuments(dto, user);
    }
    presign(dto, user) {
        return this.documentService.presign(dto, user);
    }
    complete(dto, user) {
        return this.documentService.complete(dto, user);
    }
    listByStaff(staffId, user) {
        return this.documentService.listByOwner(staffId, user);
    }
    listByOwner(ownerUserId, user) {
        return this.documentService.listByOwner(ownerUserId, user);
    }
    getAssignedSummary(user) {
        return this.documentService.getAssignedSummary(user);
    }
    getPerFormDetail(ownerUserId, documentTypeId, user) {
        return this.documentService.getPerFormDetail(ownerUserId, documentTypeId, user);
    }
    async exportPerFormPdf(ownerUserId, documentTypeId, user, res) {
        const { buffer, fileName } = await this.documentService.exportPerFormPdf(ownerUserId, documentTypeId, user);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
        });
        return new common_1.StreamableFile(buffer);
    }
    verify(id, user) {
        return this.documentService.verify(id, user);
    }
    getDownloadUrl(id, user) {
        return this.documentService.getDownloadUrl(id, user);
    }
    verifyMany(ids, user) {
        return this.documentService.verifyMany(ids, user);
    }
    nudge(ownerUserId, documentTypeId, user) {
        return this.documentService.nudge(ownerUserId, documentTypeId, user);
    }
};
exports.DocumentController = DocumentController;
__decorate([
    (0, common_1.Get)('search'),
    (0, common_1.UseGuards)(roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.DIRECTOR, client_1.UserRole.BRANCH_DIRECTOR),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_document_dto_js_1.SearchDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "searchDocuments", null);
__decorate([
    (0, common_1.Post)('presign'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [presign_dto_js_1.PresignDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "presign", null);
__decorate([
    (0, common_1.Post)('complete'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [complete_dto_js_1.CompleteDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "complete", null);
__decorate([
    (0, common_1.Get)('staff/:staffId'),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "listByStaff", null);
__decorate([
    (0, common_1.Get)('owner/:ownerUserId'),
    __param(0, (0, common_1.Param)('ownerUserId')),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "listByOwner", null);
__decorate([
    (0, common_1.Get)('assigned/me/summary'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "getAssignedSummary", null);
__decorate([
    (0, common_1.Get)('owner/:ownerUserId/type/:documentTypeId'),
    __param(0, (0, common_1.Param)('ownerUserId')),
    __param(1, (0, common_1.Param)('documentTypeId')),
    __param(2, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "getPerFormDetail", null);
__decorate([
    (0, common_1.Get)('owner/:ownerUserId/type/:documentTypeId/export'),
    __param(0, (0, common_1.Param)('ownerUserId')),
    __param(1, (0, common_1.Param)('documentTypeId')),
    __param(2, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "exportPerFormPdf", null);
__decorate([
    (0, common_1.Patch)(':id/verify'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "verify", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "getDownloadUrl", null);
__decorate([
    (0, common_1.Patch)('verify-many'),
    __param(0, (0, common_1.Body)('ids')),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "verifyMany", null);
__decorate([
    (0, common_1.Post)('owner/:ownerUserId/type/:documentTypeId/nudge'),
    __param(0, (0, common_1.Param)('ownerUserId')),
    __param(1, (0, common_1.Param)('documentTypeId')),
    __param(2, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "nudge", null);
exports.DocumentController = DocumentController = __decorate([
    (0, common_1.Controller)('documents'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __metadata("design:paramtypes", [document_service_js_1.DocumentService])
], DocumentController);
//# sourceMappingURL=document.controller.js.map
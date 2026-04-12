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
exports.DocumentTypeController = void 0;
const common_1 = require("@nestjs/common");
const document_type_service_1 = require("./document-type.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const database_enum_1 = require("../common/enums/database.enum");
const create_document_type_dto_1 = require("./dto/create-document-type.dto");
const assign_document_type_dto_1 = require("./dto/assign-document-type.dto");
const update_document_type_dto_1 = require("./dto/update-document-type.dto");
let DocumentTypeController = class DocumentTypeController {
    constructor(documentTypeService) {
        this.documentTypeService = documentTypeService;
    }
    create(user, dto) {
        return this.documentTypeService.create(dto, user);
    }
    assignUsers(id, dto, user) {
        return this.documentTypeService.assignUsers(id, dto.userIds, user);
    }
    unassignUser(id, userId, user) {
        return this.documentTypeService.unassignUser(id, userId, user);
    }
    assignedToMe(user) {
        return this.documentTypeService.getAssignedForCurrentUser(user);
    }
    assignees(id, user) {
        return this.documentTypeService.getAssignees(id, user);
    }
    findAll(user, schoolId, branchId, targetRole) {
        return this.documentTypeService.findAll({ schoolId, branchId, targetRole }, user);
    }
    update(id, dto, user) {
        return this.documentTypeService.update(id, dto, user);
    }
    findOne(id, user) {
        return this.documentTypeService.findOne(id, user);
    }
};
exports.DocumentTypeController = DocumentTypeController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_document_type_dto_1.CreateDocumentTypeDto]),
    __metadata("design:returntype", void 0)
], DocumentTypeController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_document_type_dto_1.AssignDocumentTypeDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentTypeController.prototype, "assignUsers", null);
__decorate([
    (0, common_1.Delete)(':id/assign/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], DocumentTypeController.prototype, "unassignUser", null);
__decorate([
    (0, common_1.Get)('assigned/me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DocumentTypeController.prototype, "assignedToMe", null);
__decorate([
    (0, common_1.Get)(':id/assignees'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentTypeController.prototype, "assignees", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('schoolId')),
    __param(2, (0, common_1.Query)('branchId')),
    __param(3, (0, common_1.Query)('targetRole')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], DocumentTypeController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_document_type_dto_1.UpdateDocumentTypeDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentTypeController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentTypeController.prototype, "findOne", null);
exports.DocumentTypeController = DocumentTypeController = __decorate([
    (0, common_1.Controller)('document-types'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [document_type_service_1.DocumentTypeService])
], DocumentTypeController);
//# sourceMappingURL=document-type.controller.js.map
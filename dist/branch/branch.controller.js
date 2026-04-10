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
exports.BranchController = void 0;
const common_1 = require("@nestjs/common");
const branch_service_js_1 = require("./branch.service.js");
const branch_dashboard_service_js_1 = require("./branch-dashboard.service.js");
const create_branch_dto_js_1 = require("./dto/create-branch.dto.js");
const update_branch_dto_js_1 = require("./dto/update-branch.dto.js");
const jwt_auth_guard_js_1 = require("../auth/guards/jwt-auth.guard.js");
const roles_guard_js_1 = require("../auth/guards/roles.guard.js");
const roles_decorator_js_1 = require("../auth/decorators/roles.decorator.js");
const current_user_decorator_js_1 = require("../auth/decorators/current-user.decorator.js");
const client_1 = require("@prisma/client");
let BranchController = class BranchController {
    branchService;
    branchDashboardService;
    constructor(branchService, branchDashboardService) {
        this.branchService = branchService;
        this.branchDashboardService = branchDashboardService;
    }
    create(schoolId, dto, user) {
        return this.branchService.create(schoolId, dto, user);
    }
    findAllBySchool(schoolId, user) {
        return this.branchService.findAllBySchool(schoolId, user);
    }
    dashboardSummary(id, user) {
        return this.branchDashboardService.getDashboardSummary(id, user);
    }
    recentDocuments(id, limit, user) {
        const safe = Math.min(Math.max(limit, 1), 100);
        return this.branchDashboardService.getRecentDocuments(id, user, safe);
    }
    compliancePeople(id, user) {
        return this.branchDashboardService.getCompliancePeople(id, user);
    }
    findOne(id, user) {
        return this.branchService.findOne(id, user);
    }
    listTeachers(id, user) {
        return this.branchService.listTeachers(id, user);
    }
    update(id, dto, user) {
        return this.branchService.update(id, dto, user);
    }
    remove(id, user) {
        return this.branchService.remove(id, user);
    }
};
exports.BranchController = BranchController;
__decorate([
    (0, common_1.Post)('schools/:schoolId/branches'),
    (0, common_1.UseGuards)(roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.DIRECTOR),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_branch_dto_js_1.CreateBranchDto, Object]),
    __metadata("design:returntype", void 0)
], BranchController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('schools/:schoolId/branches'),
    (0, common_1.UseGuards)(roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.DIRECTOR, client_1.UserRole.DIRECTOR, client_1.UserRole.BRANCH_DIRECTOR),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BranchController.prototype, "findAllBySchool", null);
__decorate([
    (0, common_1.Get)('branches/:id/dashboard-summary'),
    (0, common_1.UseGuards)(roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BranchController.prototype, "dashboardSummary", null);
__decorate([
    (0, common_1.Get)('branches/:id/documents/recent'),
    (0, common_1.UseGuards)(roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.DIRECTOR, client_1.UserRole.DIRECTOR, client_1.UserRole.BRANCH_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(2, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", void 0)
], BranchController.prototype, "recentDocuments", null);
__decorate([
    (0, common_1.Get)('branches/:id/compliance/people'),
    (0, common_1.UseGuards)(roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.DIRECTOR, client_1.UserRole.DIRECTOR, client_1.UserRole.BRANCH_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BranchController.prototype, "compliancePeople", null);
__decorate([
    (0, common_1.Get)('branches/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BranchController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('branches/:id/teachers'),
    (0, common_1.UseGuards)(roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.DIRECTOR, client_1.UserRole.DIRECTOR, client_1.UserRole.BRANCH_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BranchController.prototype, "listTeachers", null);
__decorate([
    (0, common_1.Patch)('branches/:id'),
    (0, common_1.UseGuards)(roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.DIRECTOR, client_1.UserRole.DIRECTOR, client_1.UserRole.BRANCH_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_branch_dto_js_1.UpdateBranchDto, Object]),
    __metadata("design:returntype", void 0)
], BranchController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('branches/:id'),
    (0, common_1.UseGuards)(roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BranchController.prototype, "remove", null);
exports.BranchController = BranchController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __metadata("design:paramtypes", [branch_service_js_1.BranchService,
        branch_dashboard_service_js_1.BranchDashboardService])
], BranchController);
//# sourceMappingURL=branch.controller.js.map
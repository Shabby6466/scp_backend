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
exports.SchoolController = void 0;
const common_1 = require("@nestjs/common");
const school_service_1 = require("./school.service");
const create_school_dto_1 = require("./dto/create-school.dto");
const update_school_dto_1 = require("./dto/update-school.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const database_enum_1 = require("../common/enums/database.enum");
let SchoolController = class SchoolController {
    constructor(schoolService) {
        this.schoolService = schoolService;
    }
    create(dto) {
        return this.schoolService.create(dto);
    }
    findAll(user) {
        return this.schoolService.findAll(user);
    }
    dashboardSummary(id, user) {
        return this.schoolService.getDashboardSummary(id, user);
    }
    listComplianceRequirements(id, user) {
        return this.schoolService.listComplianceRequirements(id, user);
    }
    listInspectionTypes(id, user) {
        return this.schoolService.listInspectionTypes(id, user);
    }
    listCertificationRecords(id, user) {
        return this.schoolService.listCertificationRecords(id, user);
    }
    findOne(id, user) {
        return this.schoolService.findOne(id, user);
    }
    update(id, dto, user) {
        return this.schoolService.update(id, dto, user);
    }
    remove(id) {
        return this.schoolService.remove(id);
    }
};
exports.SchoolController = SchoolController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_school_dto_1.CreateSchoolDto]),
    __metadata("design:returntype", void 0)
], SchoolController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SchoolController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/dashboard-summary'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN, database_enum_1.UserRole.DIRECTOR, database_enum_1.UserRole.BRANCH_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SchoolController.prototype, "dashboardSummary", null);
__decorate([
    (0, common_1.Get)(':id/compliance-requirements'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN, database_enum_1.UserRole.DIRECTOR, database_enum_1.UserRole.BRANCH_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SchoolController.prototype, "listComplianceRequirements", null);
__decorate([
    (0, common_1.Get)(':id/inspection-types'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN, database_enum_1.UserRole.DIRECTOR, database_enum_1.UserRole.BRANCH_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SchoolController.prototype, "listInspectionTypes", null);
__decorate([
    (0, common_1.Get)(':id/certification-records'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN, database_enum_1.UserRole.DIRECTOR, database_enum_1.UserRole.BRANCH_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SchoolController.prototype, "listCertificationRecords", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SchoolController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN, database_enum_1.UserRole.DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_school_dto_1.UpdateSchoolDto, Object]),
    __metadata("design:returntype", void 0)
], SchoolController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SchoolController.prototype, "remove", null);
exports.SchoolController = SchoolController = __decorate([
    (0, common_1.Controller)('schools'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [school_service_1.SchoolService])
], SchoolController);
//# sourceMappingURL=school.controller.js.map
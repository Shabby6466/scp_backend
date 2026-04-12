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
exports.StudentParentController = void 0;
const common_1 = require("@nestjs/common");
const database_enum_1 = require("../common/enums/database.enum");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const student_parent_service_1 = require("./student-parent.service");
const register_child_dto_1 = require("./dto/register-child.dto");
let StudentParentController = class StudentParentController {
    constructor(studentParentService) {
        this.studentParentService = studentParentService;
    }
    registerChild(dto, user) {
        return this.studentParentService.registerChild(dto, user);
    }
    listForParent(parentId, user) {
        return this.studentParentService.listForParent(parentId, user);
    }
    listForStudent(studentId, user) {
        return this.studentParentService.listForStudent(studentId, user);
    }
    create(body, user) {
        return this.studentParentService.create(body, user);
    }
    remove(id, user) {
        return this.studentParentService.remove(id, user);
    }
};
exports.StudentParentController = StudentParentController;
__decorate([
    (0, common_1.Post)('register-child'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.PARENT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_child_dto_1.RegisterChildDto, Object]),
    __metadata("design:returntype", void 0)
], StudentParentController.prototype, "registerChild", null);
__decorate([
    (0, common_1.Get)('parent/:parentId'),
    __param(0, (0, common_1.Param)('parentId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StudentParentController.prototype, "listForParent", null);
__decorate([
    (0, common_1.Get)('student/:studentId'),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StudentParentController.prototype, "listForStudent", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StudentParentController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StudentParentController.prototype, "remove", null);
exports.StudentParentController = StudentParentController = __decorate([
    (0, common_1.Controller)('student-parents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [student_parent_service_1.StudentParentService])
], StudentParentController);
//# sourceMappingURL=student-parent.controller.js.map
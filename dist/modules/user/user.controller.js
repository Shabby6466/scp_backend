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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("./user.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const search_user_dto_1 = require("./dto/search-user.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const database_enum_1 = require("../common/enums/database.enum");
let UserController = class UserController {
    constructor(userService) {
        this.userService = userService;
    }
    listUsers(dto, user) {
        return this.userService.listUsersForCaller(dto, user);
    }
    searchUsers(dto, user) {
        return this.userService.searchUsers(dto, user);
    }
    getUserDetail(id, user) {
        return this.userService.getUserDetail(id, user);
    }
    findOneById(id, user) {
        return this.userService.findOneById(id, user);
    }
    createUserGlobal(dto, user) {
        return this.userService.createUser(dto, user);
    }
    updateUser(id, dto, user) {
        return this.userService.updateUser(id, dto, user);
    }
    deleteUser(id, user) {
        return this.userService.remove(id, user.id);
    }
    createUser(schoolId, dto, user) {
        return this.userService.createUser({ ...dto, schoolId: dto.schoolId ?? schoolId }, user);
    }
    listBySchool(schoolId, user, dto) {
        return this.userService.listBySchool(schoolId, user, dto);
    }
    listBranchDirectorCandidates(schoolId, user) {
        return this.userService.listBranchDirectorCandidates(schoolId, user);
    }
    async listTeachers(user) {
        return this.userService.listTeachersForSchoolDirector(user);
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Get)('users'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN, database_enum_1.UserRole.DIRECTOR, database_enum_1.UserRole.BRANCH_DIRECTOR),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_user_dto_1.SearchUserDto, Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Get)('users/search'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN, database_enum_1.UserRole.DIRECTOR, database_enum_1.UserRole.BRANCH_DIRECTOR),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_user_dto_1.SearchUserDto, Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)('users/:id/detail'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN, database_enum_1.UserRole.DIRECTOR, database_enum_1.UserRole.BRANCH_DIRECTOR, database_enum_1.UserRole.TEACHER, database_enum_1.UserRole.STUDENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "getUserDetail", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN, database_enum_1.UserRole.DIRECTOR, database_enum_1.UserRole.BRANCH_DIRECTOR, database_enum_1.UserRole.TEACHER, database_enum_1.UserRole.STUDENT, database_enum_1.UserRole.PARENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "findOneById", null);
__decorate([
    (0, common_1.Post)('users'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "createUserGlobal", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN, database_enum_1.UserRole.DIRECTOR, database_enum_1.UserRole.BRANCH_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Post)('schools/:schoolId/users'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN, database_enum_1.UserRole.DIRECTOR, database_enum_1.UserRole.BRANCH_DIRECTOR),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)('schools/:schoolId/users'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN, database_enum_1.UserRole.DIRECTOR, database_enum_1.UserRole.BRANCH_DIRECTOR),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, search_user_dto_1.SearchUserDto]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "listBySchool", null);
__decorate([
    (0, common_1.Get)('schools/:schoolId/branch-director-candidates'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN, database_enum_1.UserRole.DIRECTOR),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "listBranchDirectorCandidates", null);
__decorate([
    (0, common_1.Get)('teachers'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.DIRECTOR, database_enum_1.UserRole.BRANCH_DIRECTOR, database_enum_1.UserRole.STUDENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "listTeachers", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map
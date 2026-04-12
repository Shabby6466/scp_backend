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
exports.InvitationController = void 0;
const common_1 = require("@nestjs/common");
const database_enum_1 = require("../common/enums/database.enum");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const invitation_service_1 = require("./invitation.service");
const create_invitation_dto_1 = require("./dto/create-invitation.dto");
const class_validator_1 = require("class-validator");
class AcceptInvitationDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], AcceptInvitationDto.prototype, "userId", void 0);
class SendParentInvitationDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], SendParentInvitationDto.prototype, "schoolId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendParentInvitationDto.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SendParentInvitationDto.prototype, "email", void 0);
class SendDirectorInvitationDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], SendDirectorInvitationDto.prototype, "schoolId", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SendDirectorInvitationDto.prototype, "email", void 0);
class SendTeacherInvitationDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], SendTeacherInvitationDto.prototype, "schoolId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendTeacherInvitationDto.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SendTeacherInvitationDto.prototype, "email", void 0);
let InvitationController = class InvitationController {
    constructor(invitationService) {
        this.invitationService = invitationService;
    }
    send(dto, user) {
        return this.invitationService.send(dto, user);
    }
    sendParent(dto, user) {
        return this.invitationService.send({
            schoolId: dto.schoolId,
            branchId: dto.branchId,
            email: dto.email,
            role: database_enum_1.UserRole.PARENT,
        }, user);
    }
    sendTeacher(dto, user) {
        return this.invitationService.send({
            schoolId: dto.schoolId,
            branchId: dto.branchId,
            email: dto.email,
            role: database_enum_1.UserRole.TEACHER,
        }, user);
    }
    sendDirector(dto, user) {
        return this.invitationService.send({
            schoolId: dto.schoolId,
            email: dto.email,
            role: database_enum_1.UserRole.DIRECTOR,
        }, user);
    }
    validate(token) {
        return this.invitationService.validate(token);
    }
    findAll(schoolId, branchId, status, user) {
        return this.invitationService.findAll(user, schoolId, branchId, status);
    }
    accept(token, body) {
        return this.invitationService.accept(token, body.userId);
    }
    revoke(id, user) {
        return this.invitationService.revoke(id, user);
    }
};
exports.InvitationController = InvitationController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_invitation_dto_1.CreateInvitationDto, Object]),
    __metadata("design:returntype", void 0)
], InvitationController.prototype, "send", null);
__decorate([
    (0, common_1.Post)('send-parent'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SendParentInvitationDto, Object]),
    __metadata("design:returntype", void 0)
], InvitationController.prototype, "sendParent", null);
__decorate([
    (0, common_1.Post)('send-teacher'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SendTeacherInvitationDto, Object]),
    __metadata("design:returntype", void 0)
], InvitationController.prototype, "sendTeacher", null);
__decorate([
    (0, common_1.Post)('send-director'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SendDirectorInvitationDto, Object]),
    __metadata("design:returntype", void 0)
], InvitationController.prototype, "sendDirector", null);
__decorate([
    (0, common_1.Get)('validate/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InvitationController.prototype, "validate", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Query)('schoolId')),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], InvitationController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('accept/:token'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AcceptInvitationDto]),
    __metadata("design:returntype", void 0)
], InvitationController.prototype, "accept", null);
__decorate([
    (0, common_1.Patch)(':id/revoke'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InvitationController.prototype, "revoke", null);
exports.InvitationController = InvitationController = __decorate([
    (0, common_1.Controller)('invitations'),
    __metadata("design:paramtypes", [invitation_service_1.InvitationService])
], InvitationController);
//# sourceMappingURL=invitation.controller.js.map
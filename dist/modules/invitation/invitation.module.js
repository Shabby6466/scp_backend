"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const invitation_service_1 = require("./invitation.service");
const invitation_controller_1 = require("./invitation.controller");
const invitation_entity_1 = require("../../entities/invitation.entity");
const school_module_1 = require("../school/school.module");
const branch_module_1 = require("../branch/branch.module");
const user_module_1 = require("../user/user.module");
const mailer_module_1 = require("../mailer/mailer.module");
let InvitationModule = class InvitationModule {
};
exports.InvitationModule = InvitationModule;
exports.InvitationModule = InvitationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([invitation_entity_1.Invitation]),
            (0, common_1.forwardRef)(() => school_module_1.SchoolModule),
            (0, common_1.forwardRef)(() => branch_module_1.BranchModule),
            (0, common_1.forwardRef)(() => user_module_1.UserModule),
            mailer_module_1.MailerModule,
        ],
        controllers: [invitation_controller_1.InvitationController],
        providers: [invitation_service_1.InvitationService],
        exports: [invitation_service_1.InvitationService],
    })
], InvitationModule);
//# sourceMappingURL=invitation.module.js.map
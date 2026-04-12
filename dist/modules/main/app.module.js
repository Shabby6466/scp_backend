"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = exports.adminModulesImports = exports.imports = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const nest_winston_1 = require("nest-winston");
const app_service_1 = require("./app.service");
const seeder_service_1 = require("../common/seeder.service");
const user_entity_1 = require("../../entities/user.entity");
const app_config_entity_1 = require("../../entities/app-config.entity");
const mailer_1 = require("../mailer");
const storage_1 = require("../storage");
const auth_1 = require("../auth");
const school_1 = require("../school");
const user_1 = require("../user");
const branch_module_1 = require("../branch/branch.module");
const document_type_module_1 = require("../document-type/document-type.module");
const document_1 = require("../document");
const settings_1 = require("../settings");
const analytics_module_1 = require("../analytics/analytics.module");
const compliance_category_module_1 = require("../compliance-category/compliance-category.module");
const invitation_module_1 = require("../invitation/invitation.module");
const student_parent_module_1 = require("../student-parent/student-parent.module");
exports.imports = [
    mailer_1.MailerModule,
    storage_1.StorageModule,
    auth_1.AuthModule,
    school_1.SchoolModule,
    user_1.UserModule,
    branch_module_1.BranchModule,
    document_type_module_1.DocumentTypeModule,
    document_1.DocumentModule,
    settings_1.SettingsModule,
    analytics_module_1.AnalyticsModule,
    compliance_category_module_1.ComplianceCategoryModule,
    invitation_module_1.InvitationModule,
    student_parent_module_1.StudentParentModule,
];
exports.adminModulesImports = [
    school_1.SchoolModule,
    user_1.UserModule,
    branch_module_1.BranchModule,
    settings_1.SettingsModule,
    analytics_module_1.AnalyticsModule,
];
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: app_service_1.AppService.envConfiguration(),
            }),
            nest_winston_1.WinstonModule.forRoot(app_service_1.AppService.createWinstonTransports()),
            typeorm_1.TypeOrmModule.forRoot(app_service_1.AppService.typeormConfig()),
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, app_config_entity_1.AppConfig]),
            ...exports.imports,
        ],
        providers: [app_service_1.AppService, seeder_service_1.SeederService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
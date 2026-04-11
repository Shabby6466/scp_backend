"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_js_1 = require("./app.controller.js");
const index_js_1 = require("./prisma/index.js");
const index_js_2 = require("./mailer/index.js");
const index_js_3 = require("./storage/index.js");
const index_js_4 = require("./auth/index.js");
const index_js_5 = require("./school/index.js");
const index_js_6 = require("./user/index.js");
const branch_module_js_1 = require("./branch/branch.module.js");
const document_type_module_js_1 = require("./document-type/document-type.module.js");
const index_js_7 = require("./document/index.js");
const index_js_8 = require("./settings/index.js");
const analytics_module_js_1 = require("./analytics/analytics.module.js");
const compliance_category_module_js_1 = require("./compliance-category/compliance-category.module.js");
const invitation_module_js_1 = require("./invitation/invitation.module.js");
const student_parent_module_js_1 = require("./student-parent/student-parent.module.js");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '../../.env', '../../../.env'],
            }),
            index_js_1.PrismaModule,
            index_js_2.MailerModule,
            index_js_3.StorageModule,
            index_js_4.AuthModule,
            index_js_5.SchoolModule,
            index_js_6.UserModule,
            branch_module_js_1.BranchModule,
            document_type_module_js_1.DocumentTypeModule,
            index_js_7.DocumentModule,
            index_js_8.SettingsModule,
            analytics_module_js_1.AnalyticsModule,
            compliance_category_module_js_1.ComplianceCategoryModule,
            invitation_module_js_1.InvitationModule,
            student_parent_module_js_1.StudentParentModule,
        ],
        controllers: [app_controller_js_1.AppController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentModule = void 0;
const common_1 = require("@nestjs/common");
const document_controller_js_1 = require("./document.controller.js");
const document_service_js_1 = require("./document.service.js");
const index_js_1 = require("../prisma/index.js");
const index_js_2 = require("../storage/index.js");
const index_js_3 = require("../mailer/index.js");
let DocumentModule = class DocumentModule {
};
exports.DocumentModule = DocumentModule;
exports.DocumentModule = DocumentModule = __decorate([
    (0, common_1.Module)({
        imports: [index_js_1.PrismaModule, index_js_2.StorageModule, index_js_3.MailerModule],
        controllers: [document_controller_js_1.DocumentController],
        providers: [document_service_js_1.DocumentService],
        exports: [document_service_js_1.DocumentService],
    })
], DocumentModule);
//# sourceMappingURL=document.module.js.map
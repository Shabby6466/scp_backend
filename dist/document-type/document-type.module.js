"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentTypeModule = void 0;
const common_1 = require("@nestjs/common");
const document_type_controller_js_1 = require("./document-type.controller.js");
const document_type_service_js_1 = require("./document-type.service.js");
const index_js_1 = require("../mailer/index.js");
let DocumentTypeModule = class DocumentTypeModule {
};
exports.DocumentTypeModule = DocumentTypeModule;
exports.DocumentTypeModule = DocumentTypeModule = __decorate([
    (0, common_1.Module)({
        imports: [index_js_1.MailerModule],
        controllers: [document_type_controller_js_1.DocumentTypeController],
        providers: [document_type_service_js_1.DocumentTypeService],
        exports: [document_type_service_js_1.DocumentTypeService],
    })
], DocumentTypeModule);
//# sourceMappingURL=document-type.module.js.map
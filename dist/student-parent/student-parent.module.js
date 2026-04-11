"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentParentModule = void 0;
const common_1 = require("@nestjs/common");
const student_parent_controller_js_1 = require("./student-parent.controller.js");
const student_parent_service_js_1 = require("./student-parent.service.js");
let StudentParentModule = class StudentParentModule {
};
exports.StudentParentModule = StudentParentModule;
exports.StudentParentModule = StudentParentModule = __decorate([
    (0, common_1.Module)({
        controllers: [student_parent_controller_js_1.StudentParentController],
        providers: [student_parent_service_js_1.StudentParentService],
        exports: [student_parent_service_js_1.StudentParentService],
    })
], StudentParentModule);
//# sourceMappingURL=student-parent.module.js.map
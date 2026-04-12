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
const typeorm_1 = require("@nestjs/typeorm");
const student_parent_service_1 = require("./student-parent.service");
const student_parent_controller_1 = require("./student-parent.controller");
const student_parent_entity_1 = require("../../entities/student-parent.entity");
const user_module_1 = require("../user/user.module");
let StudentParentModule = class StudentParentModule {
};
exports.StudentParentModule = StudentParentModule;
exports.StudentParentModule = StudentParentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([student_parent_entity_1.StudentParent]),
            (0, common_1.forwardRef)(() => user_module_1.UserModule),
        ],
        controllers: [student_parent_controller_1.StudentParentController],
        providers: [student_parent_service_1.StudentParentService],
        exports: [student_parent_service_1.StudentParentService],
    })
], StudentParentModule);
//# sourceMappingURL=student-parent.module.js.map
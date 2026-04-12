"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const school_service_1 = require("./school.service");
const school_controller_1 = require("./school.controller");
const school_entity_1 = require("../../entities/school.entity");
const inspection_type_entity_1 = require("../../entities/inspection-type.entity");
const compliance_requirement_entity_1 = require("../../entities/compliance-requirement.entity");
const certification_record_entity_1 = require("../../entities/certification-record.entity");
const certification_type_entity_1 = require("../../entities/certification-type.entity");
const inspection_type_service_1 = require("./inspection-type.service");
const compliance_requirement_service_1 = require("./compliance-requirement.service");
const certification_record_service_1 = require("./certification-record.service");
const user_module_1 = require("../user/user.module");
const branch_module_1 = require("../branch/branch.module");
let SchoolModule = class SchoolModule {
};
exports.SchoolModule = SchoolModule;
exports.SchoolModule = SchoolModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                school_entity_1.School,
                inspection_type_entity_1.InspectionType,
                compliance_requirement_entity_1.ComplianceRequirement,
                certification_record_entity_1.CertificationRecord,
                certification_type_entity_1.CertificationType,
            ]),
            (0, common_1.forwardRef)(() => user_module_1.UserModule),
            (0, common_1.forwardRef)(() => branch_module_1.BranchModule),
        ],
        controllers: [school_controller_1.SchoolController],
        providers: [
            school_service_1.SchoolService,
            inspection_type_service_1.InspectionTypeService,
            compliance_requirement_service_1.ComplianceRequirementService,
            certification_record_service_1.CertificationRecordService,
        ],
        exports: [
            school_service_1.SchoolService,
            inspection_type_service_1.InspectionTypeService,
            compliance_requirement_service_1.ComplianceRequirementService,
            certification_record_service_1.CertificationRecordService,
        ],
    })
], SchoolModule);
//# sourceMappingURL=school.module.js.map
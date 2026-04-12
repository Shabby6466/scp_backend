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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherPosition = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const school_entity_1 = require("./school.entity");
const teacher_profile_entity_1 = require("./teacher-profile.entity");
let TeacherPosition = class TeacherPosition extends base_entity_1.BaseEntity {
};
exports.TeacherPosition = TeacherPosition;
__decorate([
    (0, typeorm_1.Column)({ name: 'school_id', type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TeacherPosition.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name',
        type: 'varchar'
    }),
    __metadata("design:type", String)
], TeacherPosition.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'description', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], TeacherPosition.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'min_education_level', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], TeacherPosition.prototype, "minEducationLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'min_credits', nullable: true, type: 'int' }),
    __metadata("design:type", Object)
], TeacherPosition.prototype, "minCredits", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'min_ece_credits', nullable: true, type: 'int' }),
    __metadata("design:type", Object)
], TeacherPosition.prototype, "minEceCredits", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'min_years_experience', nullable: true, type: 'int' }),
    __metadata("design:type", Object)
], TeacherPosition.prototype, "minYearsExperience", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requires_cda', default: false,
        type: 'boolean'
    }),
    __metadata("design:type", Boolean)
], TeacherPosition.prototype, "requiresCda", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requires_state_cert', default: false,
        type: 'boolean'
    }),
    __metadata("design:type", Boolean)
], TeacherPosition.prototype, "requiresStateCert", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true,
        type: 'boolean'
    }),
    __metadata("design:type", Boolean)
], TeacherPosition.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => school_entity_1.School, (school) => school.teacherPositions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", school_entity_1.School)
], TeacherPosition.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => teacher_profile_entity_1.TeacherProfile, (profile) => profile.position),
    __metadata("design:type", Array)
], TeacherPosition.prototype, "teachers", void 0);
exports.TeacherPosition = TeacherPosition = __decorate([
    (0, typeorm_1.Entity)('TeacherPosition')
], TeacherPosition);
//# sourceMappingURL=teacher-position.entity.js.map
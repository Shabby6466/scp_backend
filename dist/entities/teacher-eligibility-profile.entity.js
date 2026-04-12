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
exports.TeacherEligibilityProfile = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const user_entity_1 = require("./user.entity");
const school_entity_1 = require("./school.entity");
let TeacherEligibilityProfile = class TeacherEligibilityProfile extends base_entity_1.BaseEntity {
};
exports.TeacherEligibilityProfile = TeacherEligibilityProfile;
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', unique: true, type: 'uuid' }),
    __metadata("design:type", String)
], TeacherEligibilityProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'school_id', type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TeacherEligibilityProfile.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'education_level', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], TeacherEligibilityProfile.prototype, "educationLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'education_field', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], TeacherEligibilityProfile.prototype, "educationField", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_credits', nullable: true, type: 'int' }),
    __metadata("design:type", Object)
], TeacherEligibilityProfile.prototype, "totalCredits", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ece_credits', nullable: true, type: 'int' }),
    __metadata("design:type", Object)
], TeacherEligibilityProfile.prototype, "eceCredits", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'years_experience', nullable: true, type: 'int' }),
    __metadata("design:type", Object)
], TeacherEligibilityProfile.prototype, "yearsExperience", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resume_path', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], TeacherEligibilityProfile.prototype, "resumePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cda_credential', default: false,
        type: 'boolean'
    }),
    __metadata("design:type", Boolean)
], TeacherEligibilityProfile.prototype, "cdaCredential", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'state_certification', default: false,
        type: 'boolean'
    }),
    __metadata("design:type", Boolean)
], TeacherEligibilityProfile.prototype, "stateCertification", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'first_aid_certified', default: false,
        type: 'boolean'
    }),
    __metadata("design:type", Boolean)
], TeacherEligibilityProfile.prototype, "firstAidCertified", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cpr_certified', default: false,
        type: 'boolean'
    }),
    __metadata("design:type", Boolean)
], TeacherEligibilityProfile.prototype, "cprCertified", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'languages', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], TeacherEligibilityProfile.prototype, "languages", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notes', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], TeacherEligibilityProfile.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ai_analysis', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], TeacherEligibilityProfile.prototype, "aiAnalysis", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ai_analyzed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], TeacherEligibilityProfile.prototype, "aiAnalyzedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.eligibilityProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], TeacherEligibilityProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => school_entity_1.School, (school) => school.eligibilityProfiles, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", school_entity_1.School)
], TeacherEligibilityProfile.prototype, "school", void 0);
exports.TeacherEligibilityProfile = TeacherEligibilityProfile = __decorate([
    (0, typeorm_1.Entity)('TeacherEligibilityProfile')
], TeacherEligibilityProfile);
//# sourceMappingURL=teacher-eligibility-profile.entity.js.map
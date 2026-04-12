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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const database_enum_1 = require("../modules/common/enums/database.enum");
const school_entity_1 = require("./school.entity");
const branch_entity_1 = require("./branch.entity");
const document_entity_1 = require("./document.entity");
const director_profile_entity_1 = require("./director-profile.entity");
const branch_director_profile_entity_1 = require("./branch-director-profile.entity");
const teacher_profile_entity_1 = require("./teacher-profile.entity");
const student_profile_entity_1 = require("./student-profile.entity");
const parent_profile_entity_1 = require("./parent-profile.entity");
const teacher_eligibility_profile_entity_1 = require("./teacher-eligibility-profile.entity");
const student_parent_entity_1 = require("./student-parent.entity");
let User = class User extends base_entity_1.BaseEntity {
};
exports.User = User;
__decorate([
    (0, typeorm_1.Column)({ name: 'email', unique: true,
        type: 'varchar'
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password', nullable: true, select: false, type: 'varchar' }),
    __metadata("design:type", Object)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'phone', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], User.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'role',
        type: 'enum',
        enum: database_enum_1.UserRole,
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)('enum', {
        name: 'authorities',
        enum: database_enum_1.UserRole,
        array: true,
        default: [],
    }),
    __metadata("design:type", Array)
], User.prototype, "authorities", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'school_id', nullable: true, type: 'uuid' }),
    __metadata("design:type", Object)
], User.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'branch_id', nullable: true, type: 'uuid' }),
    __metadata("design:type", Object)
], User.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_by_id', nullable: true, type: 'uuid' }),
    __metadata("design:type", Object)
], User.prototype, "assignedById", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'staff_position',
        type: 'enum',
        enum: database_enum_1.StaffPosition,
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "staffPosition", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'staff_clearance_active', default: false,
        type: 'boolean'
    }),
    __metadata("design:type", Boolean)
], User.prototype, "staffClearanceActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'email_verified_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "emailVerifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_by', nullable: true, type: 'uuid' }),
    __metadata("design:type", Object)
], User.prototype, "deletedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => school_entity_1.School, (school) => school.users, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", school_entity_1.School)
], User.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => branch_entity_1.Branch, (branch) => branch.users, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'branch_id' }),
    __metadata("design:type", branch_entity_1.Branch)
], User.prototype, "branch", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User, (user) => user.assignedUsers, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_by_id' }),
    __metadata("design:type", User)
], User.prototype, "assignedBy", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => User, (user) => user.assignedBy),
    __metadata("design:type", Array)
], User.prototype, "assignedUsers", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => director_profile_entity_1.DirectorProfile, (profile) => profile.user),
    __metadata("design:type", director_profile_entity_1.DirectorProfile)
], User.prototype, "directorProfile", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => branch_director_profile_entity_1.BranchDirectorProfile, (profile) => profile.user),
    __metadata("design:type", branch_director_profile_entity_1.BranchDirectorProfile)
], User.prototype, "branchDirectorProfile", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => teacher_profile_entity_1.TeacherProfile, (profile) => profile.user),
    __metadata("design:type", teacher_profile_entity_1.TeacherProfile)
], User.prototype, "teacherProfile", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => student_profile_entity_1.StudentProfile, (profile) => profile.user),
    __metadata("design:type", student_profile_entity_1.StudentProfile)
], User.prototype, "studentProfile", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => parent_profile_entity_1.ParentProfile, (profile) => profile.user),
    __metadata("design:type", parent_profile_entity_1.ParentProfile)
], User.prototype, "parentProfile", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => teacher_eligibility_profile_entity_1.TeacherEligibilityProfile, (profile) => profile.user),
    __metadata("design:type", teacher_eligibility_profile_entity_1.TeacherEligibilityProfile)
], User.prototype, "eligibilityProfile", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => student_parent_entity_1.StudentParent, (link) => link.student),
    __metadata("design:type", Array)
], User.prototype, "studentLinks", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => student_parent_entity_1.StudentParent, (link) => link.parent),
    __metadata("design:type", Array)
], User.prototype, "parentLinks", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => document_entity_1.Document, (doc) => doc.ownerUser),
    __metadata("design:type", Array)
], User.prototype, "documents", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => document_entity_1.Document, (doc) => doc.uploadedBy),
    __metadata("design:type", Array)
], User.prototype, "uploadedDocuments", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => document_entity_1.DocumentType, (type) => type.requiredUsers),
    __metadata("design:type", Array)
], User.prototype, "requiredDocTypes", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('User')
], User);
//# sourceMappingURL=user.entity.js.map
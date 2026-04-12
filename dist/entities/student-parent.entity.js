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
exports.StudentParent = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const user_entity_1 = require("./user.entity");
let StudentParent = class StudentParent extends base_entity_1.BaseEntity {
};
exports.StudentParent = StudentParent;
__decorate([
    (0, typeorm_1.Column)({ name: 'student_id',
        type: 'varchar'
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], StudentParent.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_id',
        type: 'varchar'
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], StudentParent.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'relation', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], StudentParent.prototype, "relation", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_primary', default: false,
        type: 'boolean'
    }),
    __metadata("design:type", Boolean)
], StudentParent.prototype, "isPrimary", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.studentLinks, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", user_entity_1.User)
], StudentParent.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.parentLinks, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id' }),
    __metadata("design:type", user_entity_1.User)
], StudentParent.prototype, "parent", void 0);
exports.StudentParent = StudentParent = __decorate([
    (0, typeorm_1.Entity)('StudentParent'),
    (0, typeorm_1.Unique)(['studentId', 'parentId'])
], StudentParent);
//# sourceMappingURL=student-parent.entity.js.map
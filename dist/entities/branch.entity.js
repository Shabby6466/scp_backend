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
exports.Branch = void 0;
const base_entity_1 = require("./base.entity");
const school_entity_1 = require("./school.entity");
const user_entity_1 = require("./user.entity");
const typeorm_1 = require("typeorm");
let Branch = class Branch extends base_entity_1.BaseEntity {
};
exports.Branch = Branch;
__decorate([
    (0, typeorm_1.Column)({ name: 'name',
        type: 'varchar'
    }),
    __metadata("design:type", String)
], Branch.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'school_id',
        type: 'varchar'
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Branch.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], Branch.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'city', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], Branch.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'state', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], Branch.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'zip_code', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], Branch.prototype, "zipCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'phone', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], Branch.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'email', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], Branch.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'min_age', nullable: true, type: 'int' }),
    __metadata("design:type", Object)
], Branch.prototype, "minAge", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_age', nullable: true, type: 'int' }),
    __metadata("design:type", Object)
], Branch.prototype, "maxAge", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_capacity', nullable: true, type: 'int' }),
    __metadata("design:type", Object)
], Branch.prototype, "totalCapacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_primary', default: false,
        type: 'boolean'
    }),
    __metadata("design:type", Boolean)
], Branch.prototype, "isPrimary", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true,
        type: 'boolean'
    }),
    __metadata("design:type", Boolean)
], Branch.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notes', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Branch.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_by', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], Branch.prototype, "deletedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => school_entity_1.School, (school) => school.branches, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", school_entity_1.School)
], Branch.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_entity_1.User, (user) => user.branch),
    __metadata("design:type", Array)
], Branch.prototype, "users", void 0);
exports.Branch = Branch = __decorate([
    (0, typeorm_1.Entity)('Branch')
], Branch);
//# sourceMappingURL=branch.entity.js.map
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopeGuard = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const database_enum_1 = require("../../common/enums/database.enum");
const branch_entity_1 = require("../../../entities/branch.entity");
const school_scope_util_1 = require("../school-scope.util");
let ScopeGuard = class ScopeGuard {
    constructor(branchRepository) {
        this.branchRepository = branchRepository;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('No user in request');
        }
        if (user.role === database_enum_1.UserRole.ADMIN) {
            return true;
        }
        const targetSchoolId = request.params?.schoolId ??
            request.query?.schoolId ??
            request.body?.schoolId;
        const targetBranchId = request.params?.branchId ??
            request.query?.branchId ??
            request.body?.branchId;
        if ((0, school_scope_util_1.isSchoolDirector)(user)) {
            if (targetSchoolId && targetSchoolId !== user.schoolId) {
                throw new common_1.ForbiddenException('Cannot access another school');
            }
            if (targetBranchId) {
                const branch = await this.branchRepository.findOne({
                    where: { id: targetBranchId },
                });
                if (!branch || branch.schoolId !== user.schoolId) {
                    throw new common_1.ForbiddenException('Cannot access this branch');
                }
            }
            return true;
        }
        if (user.role === database_enum_1.UserRole.BRANCH_DIRECTOR) {
            if (targetSchoolId && targetSchoolId !== user.schoolId) {
                throw new common_1.ForbiddenException('Cannot access another school');
            }
            if (targetBranchId && targetBranchId !== user.branchId) {
                throw new common_1.ForbiddenException('Cannot access another branch');
            }
            return true;
        }
        if (user.role === database_enum_1.UserRole.TEACHER) {
            if (targetBranchId && targetBranchId !== user.branchId) {
                throw new common_1.ForbiddenException('Cannot access another branch');
            }
            return true;
        }
        return true;
    }
};
exports.ScopeGuard = ScopeGuard;
exports.ScopeGuard = ScopeGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(branch_entity_1.Branch)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ScopeGuard);
//# sourceMappingURL=scope.guard.js.map
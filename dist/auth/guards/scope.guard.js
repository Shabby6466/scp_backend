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
exports.ScopeGuard = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../../prisma/prisma.service.js");
const school_scope_util_js_1 = require("../school-scope.util.js");
let ScopeGuard = class ScopeGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('No user in request');
        }
        if (user.role === client_1.UserRole.ADMIN) {
            return true;
        }
        const targetSchoolId = request.params?.schoolId ??
            request.query?.schoolId ??
            request.body?.schoolId;
        const targetBranchId = request.params?.branchId ??
            request.query?.branchId ??
            request.body?.branchId;
        if ((0, school_scope_util_js_1.isSchoolDirector)(user)) {
            if (targetSchoolId && targetSchoolId !== user.schoolId) {
                throw new common_1.ForbiddenException('Cannot access another school');
            }
            if (targetBranchId) {
                const branch = await this.prisma.branch.findUnique({
                    where: { id: targetBranchId },
                });
                if (!branch || branch.schoolId !== user.schoolId) {
                    throw new common_1.ForbiddenException('Cannot access this branch');
                }
            }
            return true;
        }
        if (user.role === client_1.UserRole.BRANCH_DIRECTOR) {
            if (targetSchoolId && targetSchoolId !== user.schoolId) {
                throw new common_1.ForbiddenException('Cannot access another school');
            }
            if (targetBranchId && targetBranchId !== user.branchId) {
                throw new common_1.ForbiddenException('Cannot access another branch');
            }
            return true;
        }
        if (user.role === client_1.UserRole.TEACHER) {
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
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], ScopeGuard);
//# sourceMappingURL=scope.guard.js.map
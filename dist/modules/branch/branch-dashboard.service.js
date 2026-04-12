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
exports.BranchDashboardService = exports.NEAR_EXPIRY_DAYS = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const branch_entity_1 = require("../../entities/branch.entity");
const database_enum_1 = require("../common/enums/database.enum");
const school_scope_util_1 = require("../auth/school-scope.util");
const user_service_1 = require("../user/user.service");
const document_service_1 = require("../document/document.service");
exports.NEAR_EXPIRY_DAYS = 30;
let BranchDashboardService = class BranchDashboardService {
    constructor(branchRepository, userService, documentService) {
        this.branchRepository = branchRepository;
        this.userService = userService;
        this.documentService = documentService;
    }
    async ensureBranchDashboardAccess(branchId, user) {
        const branch = await this.branchRepository.findOne({
            where: { id: branchId },
        });
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found');
        }
        if (user.role === database_enum_1.UserRole.ADMIN) {
            return branch;
        }
        if (user.role === database_enum_1.UserRole.DIRECTOR) {
            if (user.schoolId !== branch.schoolId) {
                throw new common_1.ForbiddenException('Cannot access this branch');
            }
            return branch;
        }
        if ((0, school_scope_util_1.directorOwnsBranchSchool)(user, branch.schoolId)) {
            return branch;
        }
        if ((0, school_scope_util_1.canManageBranchLikeDirector)(user, branch)) {
            return branch;
        }
        throw new common_1.ForbiddenException('Cannot access branch dashboard');
    }
    async getDashboardSummary(branchId, user) {
        const branch = await this.ensureBranchDashboardAccess(branchId, user);
        const now = new Date();
        const [studentUsers, teachers] = await Promise.all([
            this.userService.findStudentsWithRequiredDocs(branchId),
            this.userService.findTeachersWithRequiredDocs(branchId),
        ]);
        const ownerIds = [
            ...studentUsers.map((u) => u.id),
            ...teachers.map((u) => u.id),
        ];
        const branchDocs = ownerIds.length === 0
            ? []
            : await this.documentService.findSummaryDocsByOwnerIds(ownerIds);
        let formsNearExpiryCount = 0;
        const satisfiedKeys = new Set();
        for (const d of branchDocs) {
            if (this.isNearExpiry(d.expiresAt, now)) {
                formsNearExpiryCount += 1;
            }
            if (!this.isDocCurrentlyValid(d.expiresAt, now))
                continue;
            satisfiedKeys.add(`${d.ownerUserId}:${d.documentTypeId}`);
        }
        let requiredSlots = 0;
        let satisfiedSlots = 0;
        const countPerson = (u) => {
            if (!u.requiredDocTypes)
                return;
            for (const t of u.requiredDocTypes) {
                requiredSlots += 1;
                if (satisfiedKeys.has(`${u.id}:${t.id}`))
                    satisfiedSlots += 1;
            }
        };
        for (const s of studentUsers)
            countPerson(s);
        for (const t of teachers)
            countPerson(t);
        const missingSlots = requiredSlots - satisfiedSlots;
        const teachersWithPosition = teachers.filter((t) => t.staffPosition != null && t.branchId === branchId);
        const teachersConsidered = teachersWithPosition.length;
        let teachersWithAllRequiredForms = 0;
        for (const teacher of teachersWithPosition) {
            const reqs = teacher.requiredDocTypes || [];
            if (reqs.length === 0) {
                teachersWithAllRequiredForms += 1;
                continue;
            }
            const allOk = reqs.every((t) => satisfiedKeys.has(`${teacher.id}:${t.id}`));
            if (allOk)
                teachersWithAllRequiredForms += 1;
        }
        return {
            branchId,
            schoolId: branch.schoolId,
            studentCount: studentUsers.length,
            teacherCount: teachers.length,
            teachersConsidered,
            teachersWithAllRequiredForms,
            formsNearExpiryCount,
            compliance: {
                requiredSlots,
                satisfiedSlots,
                missingSlots,
            },
        };
    }
    async getRecentDocuments(branchId, user, limit = 20) {
        await this.ensureBranchDashboardAccess(branchId, user);
        const merged = await this.documentService.findRecentDocsByBranch(branchId, limit);
        return merged.map((d) => ({
            id: d.id,
            formRef: d.id.slice(0, 8),
            fileName: d.fileName,
            documentTypeName: d.documentType.name,
            category: d.documentType.targetRole,
            issuedAt: d.issuedAt?.toISOString() ?? null,
            expiresAt: d.expiresAt?.toISOString() ?? null,
            createdAt: d.createdAt.toISOString(),
            addedBy: {
                id: d.uploadedBy?.id,
                name: d.uploadedBy?.name,
                email: d.uploadedBy?.email,
            },
        }));
    }
    async getCompliancePeople(branchId, user) {
        await this.ensureBranchDashboardAccess(branchId, user);
        const now = new Date();
        const [studentUsers, teachers] = await Promise.all([
            this.userService.findStudentsWithRequiredDocs(branchId),
            this.userService.findTeachersWithRequiredDocs(branchId),
        ]);
        const ownerIds = [
            ...studentUsers.map((u) => u.id),
            ...teachers.map((u) => u.id),
        ];
        const docs = ownerIds.length === 0
            ? []
            : await this.documentService.findComplianceDocsByOwnerIds(ownerIds);
        const validPair = new Set();
        for (const d of docs) {
            if (!this.isDocCurrentlyValid(d.expiresAt, now))
                continue;
            validPair.add(`${d.ownerUserId}:${d.documentTypeId}`);
        }
        const students = studentUsers.map((s) => {
            const requiredIds = (s.requiredDocTypes || []).map((t) => t.id);
            const requiredCount = requiredIds.length;
            let uploadedSatisfiedCount = 0;
            for (const id of requiredIds) {
                if (validPair.has(`${s.id}:${id}`))
                    uploadedSatisfiedCount += 1;
            }
            return {
                kind: 'STUDENT',
                userId: s.id,
                name: s.name ?? s.email,
                guardianName: s.studentProfile?.guardianName ?? null,
                guardianEmail: s.email,
                requiredCount,
                uploadedSatisfiedCount,
                missingCount: requiredCount - uploadedSatisfiedCount,
            };
        });
        const teacherRows = teachers.map((teacher) => {
            const requiredIds = (teacher.requiredDocTypes || []).map((t) => t.id);
            const requiredCount = requiredIds.length;
            let uploadedSatisfiedCount = 0;
            for (const id of requiredIds) {
                if (validPair.has(`${teacher.id}:${id}`))
                    uploadedSatisfiedCount += 1;
            }
            return {
                kind: 'TEACHER',
                userId: teacher.id,
                name: teacher.name ?? teacher.email,
                email: teacher.email,
                requiredCount,
                uploadedSatisfiedCount,
                missingCount: requiredCount - uploadedSatisfiedCount,
            };
        });
        return { students, teachers: teacherRows };
    }
    isDocCurrentlyValid(expiresAt, now) {
        if (expiresAt == null)
            return true;
        return expiresAt > now;
    }
    isNearExpiry(expiresAt, now) {
        if (expiresAt == null)
            return false;
        if (expiresAt <= now)
            return false;
        const end = new Date(now);
        end.setDate(end.getDate() + exports.NEAR_EXPIRY_DAYS);
        return expiresAt <= end;
    }
};
exports.BranchDashboardService = BranchDashboardService;
exports.BranchDashboardService = BranchDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(branch_entity_1.Branch)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_service_1.UserService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => document_service_1.DocumentService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        user_service_1.UserService,
        document_service_1.DocumentService])
], BranchDashboardService);
//# sourceMappingURL=branch-dashboard.service.js.map
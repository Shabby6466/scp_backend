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
exports.BranchDashboardService = exports.NEAR_EXPIRY_DAYS = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const school_scope_util_js_1 = require("../auth/school-scope.util.js");
exports.NEAR_EXPIRY_DAYS = 30;
function isDocCurrentlyValid(expiresAt, now) {
    if (expiresAt == null)
        return true;
    return expiresAt > now;
}
function isNearExpiry(expiresAt, now) {
    if (expiresAt == null)
        return false;
    if (expiresAt <= now)
        return false;
    const end = new Date(now);
    end.setDate(end.getDate() + exports.NEAR_EXPIRY_DAYS);
    return expiresAt <= end;
}
let BranchDashboardService = class BranchDashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureBranchDashboardAccess(branchId, user) {
        const branch = await this.prisma.branch.findUnique({
            where: { id: branchId },
        });
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found');
        }
        if (user.role === client_1.UserRole.ADMIN) {
            return branch;
        }
        if (user.role === client_1.UserRole.DIRECTOR) {
            if (user.schoolId !== branch.schoolId) {
                throw new common_1.ForbiddenException('Cannot access this branch');
            }
            return branch;
        }
        if ((0, school_scope_util_js_1.directorOwnsBranchSchool)(user, branch.schoolId)) {
            return branch;
        }
        if ((0, school_scope_util_js_1.canManageBranchLikeDirector)(user, branch)) {
            return branch;
        }
        throw new common_1.ForbiddenException('Cannot access branch dashboard');
    }
    async getDashboardSummary(branchId, user) {
        const branch = await this.ensureBranchDashboardAccess(branchId, user);
        const now = new Date();
        const [studentUsers, teachers] = await Promise.all([
            this.prisma.user.findMany({
                where: { branchId, role: client_1.UserRole.STUDENT },
                include: {
                    requiredDocTypes: { select: { id: true } },
                },
            }),
            this.prisma.user.findMany({
                where: { role: client_1.UserRole.TEACHER, branchId },
                include: {
                    requiredDocTypes: { select: { id: true } },
                },
            }),
        ]);
        const ownerIds = [
            ...studentUsers.map((u) => u.id),
            ...teachers.map((u) => u.id),
        ];
        const branchDocs = ownerIds.length === 0
            ? []
            : await this.prisma.document.findMany({
                where: { ownerUserId: { in: ownerIds } },
                select: {
                    id: true,
                    ownerUserId: true,
                    documentTypeId: true,
                    expiresAt: true,
                },
            });
        let formsNearExpiryCount = 0;
        const satisfiedKeys = new Set();
        for (const d of branchDocs) {
            if (isNearExpiry(d.expiresAt, now)) {
                formsNearExpiryCount += 1;
            }
            if (!isDocCurrentlyValid(d.expiresAt, now))
                continue;
            satisfiedKeys.add(`${d.ownerUserId}:${d.documentTypeId}`);
        }
        let requiredSlots = 0;
        let satisfiedSlots = 0;
        const countPerson = (u) => {
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
            const reqs = teacher.requiredDocTypes;
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
        const merged = await this.prisma.document.findMany({
            where: {
                ownerUser: { branchId },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                documentType: {
                    select: { id: true, name: true, targetRole: true },
                },
                uploadedBy: { select: { id: true, name: true, email: true } },
            },
        });
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
                id: d.uploadedBy.id,
                name: d.uploadedBy.name,
                email: d.uploadedBy.email,
            },
        }));
    }
    async getCompliancePeople(branchId, user) {
        await this.ensureBranchDashboardAccess(branchId, user);
        const now = new Date();
        const [studentUsers, teachers] = await Promise.all([
            this.prisma.user.findMany({
                where: { branchId, role: client_1.UserRole.STUDENT },
                include: {
                    requiredDocTypes: { select: { id: true } },
                    studentProfile: {
                        select: { guardianName: true, guardianPhone: true },
                    },
                },
            }),
            this.prisma.user.findMany({
                where: { role: client_1.UserRole.TEACHER, branchId },
                include: {
                    requiredDocTypes: { select: { id: true } },
                },
            }),
        ]);
        const ownerIds = [
            ...studentUsers.map((u) => u.id),
            ...teachers.map((u) => u.id),
        ];
        const docs = ownerIds.length === 0
            ? []
            : await this.prisma.document.findMany({
                where: { ownerUserId: { in: ownerIds } },
                select: {
                    ownerUserId: true,
                    documentTypeId: true,
                    expiresAt: true,
                },
            });
        const validPair = new Set();
        for (const d of docs) {
            if (!isDocCurrentlyValid(d.expiresAt, now))
                continue;
            validPair.add(`${d.ownerUserId}:${d.documentTypeId}`);
        }
        const students = studentUsers.map((s) => {
            const requiredIds = s.requiredDocTypes.map((t) => t.id);
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
            const requiredIds = teacher.requiredDocTypes.map((t) => t.id);
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
};
exports.BranchDashboardService = BranchDashboardService;
exports.BranchDashboardService = BranchDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], BranchDashboardService);
//# sourceMappingURL=branch-dashboard.service.js.map
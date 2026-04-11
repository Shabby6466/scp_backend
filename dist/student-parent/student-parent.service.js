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
exports.StudentParentService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const school_scope_util_js_1 = require("../auth/school-scope.util.js");
let StudentParentService = class StudentParentService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async assertParentRecord(parentId) {
        const parent = await this.prisma.user.findUnique({
            where: { id: parentId },
            select: { id: true, role: true, schoolId: true, branchId: true },
        });
        if (!parent) {
            throw new common_1.NotFoundException('User not found');
        }
        return parent;
    }
    async loadStudentSideUser(studentId) {
        const student = await this.prisma.user.findUnique({
            where: { id: studentId },
            select: {
                id: true,
                role: true,
                schoolId: true,
                branchId: true,
            },
        });
        if (!student) {
            throw new common_1.NotFoundException('User not found');
        }
        return student;
    }
    async assertCanAccessParentView(parentId, user) {
        const parent = await this.assertParentRecord(parentId);
        if (user.role === client_1.UserRole.ADMIN) {
            return;
        }
        if (user.id === parentId) {
            return;
        }
        if ((0, school_scope_util_js_1.isSchoolDirector)(user) && user.schoolId === parent.schoolId) {
            return;
        }
        if (user.role === client_1.UserRole.BRANCH_DIRECTOR && user.schoolId === parent.schoolId) {
            return;
        }
        if (user.role === client_1.UserRole.TEACHER && user.branchId) {
            const anyInBranch = await this.prisma.studentParent.count({
                where: {
                    parentId,
                    student: { branchId: user.branchId },
                },
            });
            if (anyInBranch > 0) {
                return;
            }
        }
        throw new common_1.ForbiddenException('Cannot access these records');
    }
    async assertCanAccessStudentView(studentId, user) {
        const student = await this.loadStudentSideUser(studentId);
        if (user.role === client_1.UserRole.ADMIN) {
            return;
        }
        if (user.id === studentId) {
            return;
        }
        if ((0, school_scope_util_js_1.isSchoolDirector)(user) && user.schoolId === student.schoolId) {
            return;
        }
        if (user.role === client_1.UserRole.BRANCH_DIRECTOR &&
            user.branchId &&
            student.branchId === user.branchId) {
            return;
        }
        if (user.role === client_1.UserRole.TEACHER &&
            user.branchId &&
            student.branchId === user.branchId) {
            return;
        }
        if (user.role === client_1.UserRole.PARENT) {
            const link = await this.prisma.studentParent.findFirst({
                where: { studentId, parentId: user.id },
            });
            if (link) {
                return;
            }
        }
        throw new common_1.ForbiddenException('Cannot access these records');
    }
    async listForParent(parentId, user) {
        await this.assertCanAccessParentView(parentId, user);
        const rows = await this.prisma.studentParent.findMany({
            where: { parentId },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        branchId: true,
                        schoolId: true,
                        branch: { select: { id: true, name: true } },
                        school: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        return rows.map((r) => ({
            id: r.id,
            studentId: r.studentId,
            parentId: r.parentId,
            relation: r.relation,
            isPrimary: r.isPrimary,
            createdAt: r.createdAt.toISOString(),
            student: r.student,
        }));
    }
    async listForStudent(studentId, user) {
        await this.assertCanAccessStudentView(studentId, user);
        const rows = await this.prisma.studentParent.findMany({
            where: { studentId },
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                        schoolId: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        return rows.map((r) => ({
            id: r.id,
            studentId: r.studentId,
            parentId: r.parentId,
            relation: r.relation,
            isPrimary: r.isPrimary,
            createdAt: r.createdAt.toISOString(),
            parent: r.parent,
        }));
    }
    async create(dto, user) {
        await this.assertCanAccessStudentView(dto.studentId, user);
        await this.assertCanAccessParentView(dto.parentId, user);
        const studentUser = await this.loadStudentSideUser(dto.studentId);
        if (studentUser.role !== client_1.UserRole.STUDENT) {
            throw new common_1.BadRequestException('studentId must refer to a user with role STUDENT');
        }
        const created = await this.prisma.studentParent.create({
            data: {
                studentId: dto.studentId,
                parentId: dto.parentId,
                relation: dto.relation?.trim() || undefined,
                isPrimary: dto.isPrimary ?? false,
            },
            include: {
                student: { select: { id: true, name: true, email: true } },
                parent: { select: { id: true, name: true, email: true } },
            },
        });
        return created;
    }
    async remove(linkId, user) {
        const link = await this.prisma.studentParent.findUnique({
            where: { id: linkId },
        });
        if (!link) {
            throw new common_1.NotFoundException('Link not found');
        }
        await this.assertCanAccessStudentView(link.studentId, user);
        await this.assertCanAccessParentView(link.parentId, user);
        await this.prisma.studentParent.delete({ where: { id: linkId } });
        return { ok: true };
    }
};
exports.StudentParentService = StudentParentService;
exports.StudentParentService = StudentParentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], StudentParentService);
//# sourceMappingURL=student-parent.service.js.map
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
exports.StudentParentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const database_enum_1 = require("../common/enums/database.enum");
const student_parent_entity_1 = require("../../entities/student-parent.entity");
const school_scope_util_1 = require("../auth/school-scope.util");
const user_service_1 = require("../user/user.service");
let StudentParentService = class StudentParentService {
    constructor(studentParentRepository, userService) {
        this.studentParentRepository = studentParentRepository;
        this.userService = userService;
    }
    async assertParentRecord(parentId) {
        const parent = await this.userService.findOneInternal(parentId);
        if (!parent) {
            throw new common_1.NotFoundException('User not found');
        }
        return parent;
    }
    async loadStudentSideUser(studentId) {
        const student = await this.userService.findOneInternal(studentId);
        if (!student) {
            throw new common_1.NotFoundException('User not found');
        }
        return student;
    }
    async assertCanAccessParentView(parentId, user) {
        const parent = await this.assertParentRecord(parentId);
        if (user.role === database_enum_1.UserRole.ADMIN) {
            return;
        }
        if (user.id === parentId) {
            return;
        }
        if ((0, school_scope_util_1.isSchoolDirector)(user) && user.schoolId === parent.schoolId) {
            return;
        }
        if (user.role === database_enum_1.UserRole.BRANCH_DIRECTOR && user.schoolId === parent.schoolId) {
            return;
        }
        if (user.role === database_enum_1.UserRole.TEACHER && user.branchId) {
            const anyInBranch = await this.studentParentRepository.count({
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
        if (user.role === database_enum_1.UserRole.ADMIN) {
            return;
        }
        if (user.id === studentId) {
            return;
        }
        if ((0, school_scope_util_1.isSchoolDirector)(user) && user.schoolId === student.schoolId) {
            return;
        }
        if (user.role === database_enum_1.UserRole.BRANCH_DIRECTOR &&
            user.branchId &&
            student.branchId === user.branchId) {
            return;
        }
        if (user.role === database_enum_1.UserRole.TEACHER &&
            user.branchId &&
            student.branchId === user.branchId) {
            return;
        }
        if (user.role === database_enum_1.UserRole.PARENT) {
            const link = await this.studentParentRepository.findOne({
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
        const rows = await this.studentParentRepository.find({
            where: { parentId },
            relations: ['student', 'student.branch', 'student.school'],
            order: { createdAt: 'ASC' },
        });
        return rows.map((r) => ({
            id: r.id,
            studentId: r.studentId,
            parentId: r.parentId,
            relation: r.relation,
            isPrimary: r.isPrimary,
            createdAt: r.createdAt.toISOString(),
            student: {
                id: r.student.id,
                name: r.student.name,
                email: r.student.email,
                role: r.student.role,
                branchId: r.student.branchId,
                schoolId: r.student.schoolId,
                branch: r.student.branch ? { id: r.student.branch.id, name: r.student.branch.name } : null,
                school: r.student.school ? { id: r.student.school.id, name: r.student.school.name } : null,
            },
        }));
    }
    async listForStudent(studentId, user) {
        await this.assertCanAccessStudentView(studentId, user);
        const rows = await this.studentParentRepository.find({
            where: { studentId },
            relations: ['parent'],
            order: { createdAt: 'ASC' },
        });
        return rows.map((r) => ({
            id: r.id,
            studentId: r.studentId,
            parentId: r.parentId,
            relation: r.relation,
            isPrimary: r.isPrimary,
            createdAt: r.createdAt.toISOString(),
            parent: {
                id: r.parent.id,
                name: r.parent.name,
                email: r.parent.email,
                phone: r.parent.phone,
                role: r.parent.role,
                schoolId: r.parent.schoolId,
            },
        }));
    }
    async create(dto, user) {
        await this.assertCanAccessStudentView(dto.studentId, user);
        await this.assertCanAccessParentView(dto.parentId, user);
        const studentUser = await this.loadStudentSideUser(dto.studentId);
        if (studentUser.role !== database_enum_1.UserRole.STUDENT) {
            throw new common_1.BadRequestException('studentId must refer to a user with role STUDENT');
        }
        const created = this.studentParentRepository.create({
            studentId: dto.studentId,
            parentId: dto.parentId,
            relation: dto.relation?.trim() || undefined,
            isPrimary: dto.isPrimary ?? false,
        });
        await this.studentParentRepository.save(created);
        return this.studentParentRepository.findOne({
            where: { id: created.id },
            relations: ['student', 'parent'],
        });
    }
    async remove(linkId, user) {
        const link = await this.studentParentRepository.findOne({
            where: { id: linkId },
        });
        if (!link) {
            throw new common_1.NotFoundException('Link not found');
        }
        await this.assertCanAccessStudentView(link.studentId, user);
        await this.assertCanAccessParentView(link.parentId, user);
        await this.studentParentRepository.delete(linkId);
        return { ok: true };
    }
};
exports.StudentParentService = StudentParentService;
exports.StudentParentService = StudentParentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_parent_entity_1.StudentParent)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_service_1.UserService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        user_service_1.UserService])
], StudentParentService);
//# sourceMappingURL=student-parent.service.js.map
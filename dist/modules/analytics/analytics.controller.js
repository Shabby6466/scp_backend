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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const database_enum_1 = require("../common/enums/database.enum");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const analytics_service_1 = require("./analytics.service");
const forms_analytics_query_dto_1 = require("./dto/forms-analytics-query.dto");
let AnalyticsController = class AnalyticsController {
    constructor(analytics) {
        this.analytics = analytics;
    }
    submissions(q, user) {
        return this.analytics.submissions(user, new Date(q.from), new Date(q.to), q.bucket, q.documentTypeId);
    }
    byUploader(q, user) {
        return this.analytics.byUploader(user, new Date(q.from), new Date(q.to), q.documentTypeId);
    }
    expiryByType(documentTypeId, user) {
        return this.analytics.expiryByType(user, documentTypeId);
    }
    getComplianceSummary(user) {
        return this.analytics.getComplianceSummary(user);
    }
    getPendingActions(user) {
        return this.analytics.getPendingActions(user);
    }
    getComplianceStats(schoolId, branchId, user) {
        return this.analytics.getComplianceStats(user, schoolId, branchId);
    }
    listExpiringDocuments(schoolId, branchId, days, limit, user) {
        return this.analytics.listExpiringDocuments(user, schoolId, branchId, days, limit);
    }
    listExpiredDocuments(schoolId, branchId, limit, user) {
        return this.analytics.listExpiredDocuments(user, schoolId, branchId, limit);
    }
    getComplianceRoot(schoolId, user) {
        const q = this.analytics.parseOptionalQueryUuid(schoolId, 'schoolId');
        const effectiveUser = user.role === database_enum_1.UserRole.ADMIN && q
            ? {
                ...user,
                role: database_enum_1.UserRole.DIRECTOR,
                schoolId: q,
                branchId: null,
            }
            : user;
        return this.analytics.getComplianceSummary(effectiveUser);
    }
    getSchoolDashboard(schoolId, user) {
        return this.analytics.getSchoolDashboardAnalytics(user, schoolId);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('forms/submissions'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forms_analytics_query_dto_1.FormsAnalyticsQueryDto, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "submissions", null);
__decorate([
    (0, common_1.Get)('forms/by-uploader'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forms_analytics_query_dto_1.FormsAnalyticsQueryDto, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "byUploader", null);
__decorate([
    (0, common_1.Get)('forms/expiry-by-type'),
    __param(0, (0, common_1.Query)('documentTypeId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "expiryByType", null);
__decorate([
    (0, common_1.Get)('compliance/summary'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getComplianceSummary", null);
__decorate([
    (0, common_1.Get)('compliance/pending-actions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getPendingActions", null);
__decorate([
    (0, common_1.Get)('compliance/stats'),
    __param(0, (0, common_1.Query)('schoolId')),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getComplianceStats", null);
__decorate([
    (0, common_1.Get)('documents/expiring'),
    __param(0, (0, common_1.Query)('schoolId')),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Query)('days', new common_1.DefaultValuePipe(30), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __param(4, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number, Number, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "listExpiringDocuments", null);
__decorate([
    (0, common_1.Get)('documents/expired'),
    __param(0, (0, common_1.Query)('schoolId')),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "listExpiredDocuments", null);
__decorate([
    (0, common_1.Get)('compliance'),
    __param(0, (0, common_1.Query)('schoolId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getComplianceRoot", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Query)('schoolId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getSchoolDashboard", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(database_enum_1.UserRole.ADMIN, database_enum_1.UserRole.DIRECTOR, database_enum_1.UserRole.BRANCH_DIRECTOR, database_enum_1.UserRole.TEACHER),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map
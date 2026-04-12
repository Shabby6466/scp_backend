"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSchoolDirector = isSchoolDirector;
exports.directorOwnsBranchSchool = directorOwnsBranchSchool;
exports.branchDirectorOwnsBranch = branchDirectorOwnsBranch;
exports.canManageBranchLikeDirector = canManageBranchLikeDirector;
exports.canManageSchoolBranches = canManageSchoolBranches;
const database_enum_1 = require("../common/enums/database.enum");
function isSchoolDirector(user) {
    return user.role === database_enum_1.UserRole.DIRECTOR && user.schoolId != null;
}
function directorOwnsBranchSchool(user, branchSchoolId) {
    return isSchoolDirector(user) && user.schoolId === branchSchoolId;
}
function branchDirectorOwnsBranch(user, branchId) {
    return user.role === database_enum_1.UserRole.BRANCH_DIRECTOR && user.branchId === branchId;
}
function canManageBranchLikeDirector(user, branch) {
    if (user.role === database_enum_1.UserRole.ADMIN)
        return true;
    if (directorOwnsBranchSchool(user, branch.schoolId))
        return true;
    if (branchDirectorOwnsBranch(user, branch.id))
        return true;
    return false;
}
function canManageSchoolBranches(user, schoolId) {
    if (user.role === database_enum_1.UserRole.ADMIN)
        return true;
    if (directorOwnsBranchSchool(user, schoolId))
        return true;
    return false;
}
//# sourceMappingURL=school-scope.util.js.map
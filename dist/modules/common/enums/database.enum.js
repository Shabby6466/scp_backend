"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationStatus = exports.EmploymentStatus = exports.DocumentStatus = exports.RenewalPeriod = exports.StaffPosition = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["DIRECTOR"] = "DIRECTOR";
    UserRole["BRANCH_DIRECTOR"] = "BRANCH_DIRECTOR";
    UserRole["TEACHER"] = "TEACHER";
    UserRole["STUDENT"] = "STUDENT";
    UserRole["PARENT"] = "PARENT";
})(UserRole || (exports.UserRole = UserRole = {}));
var StaffPosition;
(function (StaffPosition) {
    StaffPosition["ED_DIRECTOR"] = "ED_DIRECTOR";
    StaffPosition["LEAD_TEACHER"] = "LEAD_TEACHER";
    StaffPosition["ASSISTANT_TEACHER"] = "ASSISTANT_TEACHER";
    StaffPosition["PARAPROFESSIONAL"] = "PARAPROFESSIONAL";
})(StaffPosition || (exports.StaffPosition = StaffPosition = {}));
var RenewalPeriod;
(function (RenewalPeriod) {
    RenewalPeriod["NONE"] = "NONE";
    RenewalPeriod["ANNUAL"] = "ANNUAL";
    RenewalPeriod["BIENNIAL"] = "BIENNIAL";
})(RenewalPeriod || (exports.RenewalPeriod = RenewalPeriod = {}));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["PENDING"] = "PENDING";
    DocumentStatus["APPROVED"] = "APPROVED";
    DocumentStatus["REJECTED"] = "REJECTED";
    DocumentStatus["EXPIRED"] = "EXPIRED";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
var EmploymentStatus;
(function (EmploymentStatus) {
    EmploymentStatus["ACTIVE"] = "ACTIVE";
    EmploymentStatus["INACTIVE"] = "INACTIVE";
    EmploymentStatus["ON_LEAVE"] = "ON_LEAVE";
    EmploymentStatus["TERMINATED"] = "TERMINATED";
})(EmploymentStatus || (exports.EmploymentStatus = EmploymentStatus = {}));
var InvitationStatus;
(function (InvitationStatus) {
    InvitationStatus["PENDING"] = "PENDING";
    InvitationStatus["ACCEPTED"] = "ACCEPTED";
    InvitationStatus["EXPIRED"] = "EXPIRED";
    InvitationStatus["REVOKED"] = "REVOKED";
})(InvitationStatus || (exports.InvitationStatus = InvitationStatus = {}));
//# sourceMappingURL=database.enum.js.map
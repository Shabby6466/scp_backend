import { UserRole } from '@prisma/client';
export declare function isSchoolDirector(user: {
    role: UserRole;
    schoolId: string | null;
}): boolean;
export declare function directorOwnsBranchSchool(user: {
    role: UserRole;
    schoolId: string | null;
}, branchSchoolId: string): boolean;
export declare function branchDirectorOwnsBranch(user: {
    role: UserRole;
    branchId: string | null;
}, branchId: string): boolean;
export declare function canManageBranchLikeDirector(user: {
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
}, branch: {
    id: string;
    schoolId: string;
}): boolean;
export declare function canManageSchoolBranches(user: {
    role: UserRole;
    schoolId: string | null;
}, schoolId: string): boolean;

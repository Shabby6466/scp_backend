import { UserRole } from '../common/enums/database.enum';
import {
  branchDirectorOwnsBranch,
  canManageBranchLikeDirector,
  canManageSchoolBranches,
  directorOwnsBranchSchool,
  isSchoolDirector,
} from './school-scope.util';

describe('school-scope.util (branch / school boundaries)', () => {
  it('identifies school director', () => {
    expect(
      isSchoolDirector({ role: UserRole.DIRECTOR, schoolId: 's-1' }),
    ).toBe(true);
    expect(
      isSchoolDirector({ role: UserRole.DIRECTOR, schoolId: null }),
    ).toBe(false);
    expect(
      isSchoolDirector({ role: UserRole.BRANCH_DIRECTOR, schoolId: 's-1' }),
    ).toBe(false);
  });

  it('directorOwnsBranchSchool matches school id', () => {
    expect(
      directorOwnsBranchSchool(
        { role: UserRole.DIRECTOR, schoolId: 's-1' },
        's-1',
      ),
    ).toBe(true);
    expect(
      directorOwnsBranchSchool(
        { role: UserRole.DIRECTOR, schoolId: 's-1' },
        's-2',
      ),
    ).toBe(false);
  });

  it('branchDirectorOwnsBranch matches branch id', () => {
    expect(
      branchDirectorOwnsBranch(
        { role: UserRole.BRANCH_DIRECTOR, branchId: 'b-1' },
        'b-1',
      ),
    ).toBe(true);
    expect(
      branchDirectorOwnsBranch(
        { role: UserRole.BRANCH_DIRECTOR, branchId: 'b-1' },
        'b-2',
      ),
    ).toBe(false);
  });

  it('canManageBranchLikeDirector allows admin, school director, branch director', () => {
    const branch = { id: 'b-1', schoolId: 's-1' };
    expect(
      canManageBranchLikeDirector(
        { role: UserRole.ADMIN, schoolId: null, branchId: null },
        branch,
      ),
    ).toBe(true);
    expect(
      canManageBranchLikeDirector(
        { role: UserRole.DIRECTOR, schoolId: 's-1', branchId: null },
        branch,
      ),
    ).toBe(true);
    expect(
      canManageBranchLikeDirector(
        { role: UserRole.BRANCH_DIRECTOR, schoolId: 's-1', branchId: 'b-1' },
        branch,
      ),
    ).toBe(true);
    expect(
      canManageBranchLikeDirector(
        { role: UserRole.BRANCH_DIRECTOR, schoolId: 's-1', branchId: 'b-2' },
        branch,
      ),
    ).toBe(false);
  });

  it('canManageSchoolBranches excludes branch director', () => {
    expect(canManageSchoolBranches({ role: UserRole.ADMIN, schoolId: null }, 's-1')).toBe(
      true,
    );
    expect(
      canManageSchoolBranches(
        { role: UserRole.DIRECTOR, schoolId: 's-1' },
        's-1',
      ),
    ).toBe(true);
    expect(
      canManageSchoolBranches(
        { role: UserRole.BRANCH_DIRECTOR, schoolId: 's-1' },
        's-1',
      ),
    ).toBe(false);
  });
});

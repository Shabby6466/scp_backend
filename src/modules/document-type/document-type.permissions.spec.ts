import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../common/enums/database.enum';
import {
  assertCanAssignUserToDocType,
  canDefineTargetRoleForDocType,
} from './document-type.permissions';

describe('document-type.permissions', () => {
  describe('canDefineTargetRoleForDocType', () => {
    it('blocks ADMIN and DIRECTOR as targets for everyone', () => {
      expect(
        canDefineTargetRoleForDocType(UserRole.ADMIN, UserRole.ADMIN),
      ).toBe(false);
      expect(
        canDefineTargetRoleForDocType(UserRole.DIRECTOR, UserRole.DIRECTOR),
      ).toBe(false);
    });

    it('allows DIRECTOR to define STUDENT and PARENT types', () => {
      expect(
        canDefineTargetRoleForDocType(UserRole.DIRECTOR, UserRole.STUDENT),
      ).toBe(true);
      expect(
        canDefineTargetRoleForDocType(UserRole.DIRECTOR, UserRole.PARENT),
      ).toBe(true);
    });

    it('restricts BRANCH_DIRECTOR to STUDENT, PARENT, TEACHER', () => {
      expect(
        canDefineTargetRoleForDocType(
          UserRole.BRANCH_DIRECTOR,
          UserRole.STUDENT,
        ),
      ).toBe(true);
      expect(
        canDefineTargetRoleForDocType(
          UserRole.BRANCH_DIRECTOR,
          UserRole.PARENT,
        ),
      ).toBe(true);
      expect(
        canDefineTargetRoleForDocType(
          UserRole.BRANCH_DIRECTOR,
          UserRole.ADMIN,
        ),
      ).toBe(false);
    });
  });

  describe('assertCanAssignUserToDocType', () => {
    it('throws when user role does not match doc type target role', () => {
      expect(() =>
        assertCanAssignUserToDocType(
          {
            role: UserRole.DIRECTOR,
            schoolId: 's1',
            branchId: null,
          },
          {
            id: 'u1',
            role: UserRole.PARENT,
            schoolId: 's1',
            branchId: null,
          },
          { targetRole: UserRole.TEACHER, branchId: null },
        ),
      ).toThrow(BadRequestException);
    });

    it('allows branch director to assign parent in same branch or school-wide parent', () => {
      expect(() =>
        assertCanAssignUserToDocType(
          {
            role: UserRole.BRANCH_DIRECTOR,
            schoolId: 's1',
            branchId: 'b1',
          },
          {
            id: 'u1',
            role: UserRole.PARENT,
            schoolId: 's1',
            branchId: null,
          },
          { targetRole: UserRole.PARENT, branchId: null },
        ),
      ).not.toThrow();

      expect(() =>
        assertCanAssignUserToDocType(
          {
            role: UserRole.BRANCH_DIRECTOR,
            schoolId: 's1',
            branchId: 'b1',
          },
          {
            id: 'u1',
            role: UserRole.PARENT,
            schoolId: 's1',
            branchId: 'b1',
          },
          { targetRole: UserRole.PARENT, branchId: null },
        ),
      ).not.toThrow();
    });

    it('rejects branch director assigning parent from another branch', () => {
      expect(() =>
        assertCanAssignUserToDocType(
          {
            role: UserRole.BRANCH_DIRECTOR,
            schoolId: 's1',
            branchId: 'b1',
          },
          {
            id: 'u1',
            role: UserRole.PARENT,
            schoolId: 's1',
            branchId: 'b2',
          },
          { targetRole: UserRole.PARENT, branchId: null },
        ),
      ).toThrow(ForbiddenException);
    });
  });
});

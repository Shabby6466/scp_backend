import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../common/enums/database.enum';

/** Who may define a DocumentType for a given target role (create/update). */
export function canDefineTargetRoleForDocType(
  actorRole: UserRole,
  targetRole: UserRole,
): boolean {
  if (targetRole === UserRole.ADMIN || targetRole === UserRole.DIRECTOR) {
    return false;
  }
  if (actorRole === UserRole.ADMIN) {
    return true;
  }
  if (actorRole === UserRole.DIRECTOR) {
    return true;
  }
  if (actorRole === UserRole.BRANCH_DIRECTOR) {
    return (
      targetRole === UserRole.STUDENT ||
      targetRole === UserRole.PARENT ||
      targetRole === UserRole.TEACHER
    );
  }
  return false;
}

export type AssignTargetUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

export type ActorScope = {
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

export type DocTypeForAssign = {
  targetRole: UserRole;
  branchId: string | null;
};

/**
 * Validates assigning / unassigning a document type to a user account (not student profiles).
 */
export function assertCanAssignUserToDocType(
  actor: ActorScope,
  target: AssignTargetUser,
  docType: DocTypeForAssign,
): void {
  if (target.role !== docType.targetRole) {
    throw new BadRequestException(
      'Target user role does not match document type target role',
    );
  }
  if (docType.branchId && target.branchId !== docType.branchId) {
    throw new BadRequestException(
      'This document type is limited to a specific branch; pick users from that branch.',
    );
  }
  if (actor.role === UserRole.ADMIN) {
    return;
  }
  if (!actor.schoolId || !target.schoolId || target.schoolId !== actor.schoolId) {
    throw new ForbiddenException('Target user is outside your school scope');
  }
  if (actor.role === UserRole.DIRECTOR) {
    return;
  }
  if (actor.role === UserRole.BRANCH_DIRECTOR) {
    if (!actor.branchId) {
      throw new ForbiddenException('Your account is not linked to a branch');
    }
    if (
      target.role === UserRole.TEACHER ||
      target.role === UserRole.BRANCH_DIRECTOR
    ) {
      if (target.branchId !== actor.branchId) {
        throw new ForbiddenException('Target user is outside your branch scope');
      }
    }
    if (target.role === UserRole.PARENT) {
      if (
        target.branchId != null &&
        target.branchId !== actor.branchId
      ) {
        throw new ForbiddenException('Target parent is outside your branch scope');
      }
    }
    return;
  }
  throw new ForbiddenException('Cannot assign documents for your role');
}

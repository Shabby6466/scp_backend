import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/database.enum';
import { Branch } from '../../../entities/branch.entity';
import { isSchoolDirector } from '../school-scope.util';

/**
 * Ensures users can only access resources within their scope.
 * ADMIN bypasses all scope checks.
 * School DIRECTOR (schoolId set) can access any branch in their school.
 * TEACHER is limited to their branch when branchId is present on the request.
 *
 * Expects schoolId or branchId in request params, query, or body.
 */
@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No user in request');
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const targetSchoolId =
      request.params?.schoolId ??
      request.query?.schoolId ??
      request.body?.schoolId;
    const targetBranchId =
      request.params?.branchId ??
      request.query?.branchId ??
      request.body?.branchId;


    if (isSchoolDirector(user)) {
      if (targetSchoolId && targetSchoolId !== user.schoolId) {
        throw new ForbiddenException('Cannot access another school');
      }
      if (targetBranchId) {
        const branch = await this.branchRepository.findOne({
          where: { id: targetBranchId },
        });
        if (!branch || branch.schoolId !== user.schoolId) {
          throw new ForbiddenException('Cannot access this branch');
        }
      }
      return true;
    }

    if (user.role === UserRole.BRANCH_DIRECTOR) {
      if (targetSchoolId && targetSchoolId !== user.schoolId) {
        throw new ForbiddenException('Cannot access another school');
      }
      if (targetBranchId && targetBranchId !== user.branchId) {
        throw new ForbiddenException('Cannot access another branch');
      }
      return true;
    }

    if (user.role === UserRole.TEACHER) {
      if (targetBranchId && targetBranchId !== user.branchId) {
        throw new ForbiddenException('Cannot access another branch');
      }
      return true;
    }

    return true;
  }
}

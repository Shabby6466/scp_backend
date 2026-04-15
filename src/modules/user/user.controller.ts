import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/database.enum';

@Controller()
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  listUsers(
    @Query() dto: SearchUserDto,
    @CurrentUser()
    user: {
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.userService.listUsersForCaller(dto, user);
  }

  @Get('users/search')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTOR,
    UserRole.BRANCH_DIRECTOR,
  )
  searchUsers(
    @Query() dto: SearchUserDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.userService.searchUsers(dto, user);
  }

  @Get('users/:id/detail')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTOR,
    UserRole.BRANCH_DIRECTOR,
    UserRole.TEACHER,
  )
  getUserDetail(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.userService.getUserDetail(id, user);
  }

  @Get('users/:id')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTOR,
    UserRole.BRANCH_DIRECTOR,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findOneById(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.userService.findOneById(id, user);
  }

  @Post('users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createUserGlobal(
    @Body() dto: CreateUserDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
      name?: string | null;
    },
  ) {
    return this.userService.createUser(dto, user);
  }

  @Patch('users/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.userService.updateUser(id, dto, user);
  }

  @Delete('users/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteUser(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.userService.remove(id, user.id);
  }

  @Post('schools/:schoolId/users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  createUser(
    @Param('schoolId') schoolId: string,
    @Body() dto: CreateUserDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
      name?: string | null;
    },
  ) {
    return this.userService.createUser(
      { ...dto, schoolId: dto.schoolId ?? schoolId },
      user,
    );
  }

  @Get('schools/:schoolId/users')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTOR,
    UserRole.BRANCH_DIRECTOR,
  )
  listBySchool(
    @Param('schoolId') schoolId: string,
    @CurrentUser()
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
    @Query() dto: SearchUserDto,
  ) {
    return this.userService.listBySchool(schoolId, user, dto);
  }

  @Get('schools/:schoolId/branch-director-candidates')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR)
  listBranchDirectorCandidates(
    @Param('schoolId') schoolId: string,
    @CurrentUser()
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.userService.listBranchDirectorCandidates(schoolId, user);
  }

  @Get('teachers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  async listTeachers(
    @CurrentUser()
    user: {
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.userService.listTeachersForSchoolDirector(user);
  }
}

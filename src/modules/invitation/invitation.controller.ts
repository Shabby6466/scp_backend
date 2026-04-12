import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '../common/enums/database.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

class AcceptInvitationDto {
  @IsString()
  @MinLength(1)
  userId!: string;
}

class SendParentInvitationDto {
  @IsString()
  @MinLength(1)
  schoolId!: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsEmail()
  email!: string;
}

class SendDirectorInvitationDto {
  @IsString()
  @MinLength(1)
  schoolId!: string;

  @IsEmail()
  email!: string;
}

class SendTeacherInvitationDto {
  @IsString()
  @MinLength(1)
  schoolId!: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsEmail()
  email!: string;
}

@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  send(
    @Body() dto: CreateInvitationDto,
    @CurrentUser()
    user: {
      id: string;
      email: string;
      name: string | null;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.invitationService.send(dto, user);
  }

  /** Convenience endpoint used by the frontend parent-invite dialog. */
  @Post('send-parent')
  @UseGuards(JwtAuthGuard)
  sendParent(
    @Body() dto: SendParentInvitationDto,
    @CurrentUser()
    user: {
      id: string;
      email: string;
      name: string | null;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.invitationService.send(
      {
        schoolId: dto.schoolId,
        branchId: dto.branchId,
        email: dto.email,
        role: UserRole.PARENT,
      },
      user,
    );
  }

  /** Convenience endpoint for inviting staff (matches legacy `POST /invitations/send-teacher`). */
  @Post('send-teacher')
  @UseGuards(JwtAuthGuard)
  sendTeacher(
    @Body() dto: SendTeacherInvitationDto,
    @CurrentUser()
    user: {
      id: string;
      email: string;
      name: string | null;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.invitationService.send(
      {
        schoolId: dto.schoolId,
        branchId: dto.branchId,
        email: dto.email,
        role: UserRole.TEACHER,
      },
      user,
    );
  }

  /** Convenience endpoint for inviting a school director (admin flow). */
  @Post('send-director')
  @UseGuards(JwtAuthGuard)
  sendDirector(
    @Body() dto: SendDirectorInvitationDto,
    @CurrentUser()
    user: {
      id: string;
      email: string;
      name: string | null;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.invitationService.send(
      {
        schoolId: dto.schoolId,
        email: dto.email,
        role: UserRole.DIRECTOR,
      },
      user,
    );
  }

  @Get('validate/:token')
  validate(@Param('token') token: string) {
    return this.invitationService.validate(token);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('schoolId') schoolId: string | undefined,
    @Query('branchId') branchId: string | undefined,
    @Query('status') status: string | undefined,
    @CurrentUser()
    user: {
      id: string;
      email: string;
      name: string | null;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.invitationService.findAll(user, schoolId, branchId, status);
  }

  @Post('accept/:token')
  accept(@Param('token') token: string, @Body() body: AcceptInvitationDto) {
    return this.invitationService.accept(token, body.userId);
  }

  @Patch(':id/revoke')
  @UseGuards(JwtAuthGuard)
  revoke(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      email: string;
      name: string | null;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.invitationService.revoke(id, user);
  }
}

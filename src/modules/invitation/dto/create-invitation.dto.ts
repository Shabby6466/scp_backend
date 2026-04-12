import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/database.enum';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({ example: 'uuid-of-school', description: 'ID of the school issuing the invitation' })
  @IsString()
  @MinLength(1)
  schoolId!: string;

  @ApiPropertyOptional({ example: 'uuid-of-branch', description: 'ID of the branch (if applicable)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  branchId?: string;

  @ApiProperty({ example: 'new.user@example.com', description: 'Email address of the person being invited' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.TEACHER, description: 'Role assigned to the invited user' })
  @IsEnum(UserRole)
  role!: UserRole;
}

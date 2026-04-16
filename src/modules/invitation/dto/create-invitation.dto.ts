import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { UserRole } from '../../common/enums/database.enum';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({ example: 'uuid-of-school', description: 'ID of the school issuing the invitation' })
  @Transform(({ obj }) => obj.schoolId ?? obj.school_id)
  @IsString()
  @MinLength(1)
  schoolId!: string;

  @ApiPropertyOptional({ description: 'snake_case alias for schoolId (merged into schoolId)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  school_id?: string;

  @ApiPropertyOptional({ example: 'uuid-of-branch', description: 'ID of the branch (if applicable)' })
  @Transform(({ obj }) => obj.branchId ?? obj.branch_id)
  @IsOptional()
  @IsString()
  @MinLength(1)
  branchId?: string;

  @ApiPropertyOptional({ description: 'snake_case alias for branchId (merged into branchId)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  branch_id?: string;

  @ApiProperty({ example: 'new.user@example.com', description: 'Email address of the person being invited' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.TEACHER,
    description:
      'Role assigned to the invited user. Legacy `SCHOOL_ADMIN` is accepted and mapped to DIRECTOR.',
  })
  @Transform(({ value }) => {
    if (value === 'SCHOOL_ADMIN' || value === 'school_admin') {
      return UserRole.DIRECTOR;
    }
    return value;
  })
  @IsEnum(UserRole)
  role!: UserRole;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../../common/enums/database.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'jane.doe@example.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'User full name (or use first_name + last_name from legacy admin UI)',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ description: 'Split name from legacy admin UI' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.TEACHER, description: 'User role' })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({ example: 'uuid-of-school', description: 'School ID (if applicable)' })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional({ description: 'snake_case alias for schoolId' })
  @IsOptional()
  @IsString()
  school_id?: string;

  @ApiPropertyOptional({ example: 'uuid-of-branch', description: 'Branch ID (if applicable)' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'snake_case alias for branchId' })
  @IsOptional()
  @IsString()
  branch_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({
    example: 'TempPass123!',
    description:
      'Manual account mode: set an initial password now instead of OTP invite',
  })
  @ValidateIf(
    (o: CreateUserDto) =>
      typeof o.password === 'string' && o.password.length > 0,
  )
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hire_date?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certification_type?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certification_expiry?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employment_status?: string | null;
}

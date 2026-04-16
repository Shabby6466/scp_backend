import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { UserRole } from '../../common/enums/database.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane Smith', description: 'Updated full name' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name?: string;

  @ApiPropertyOptional({ description: 'Split name fields from legacy admin UI' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ example: 'NewSecretPassword123', description: 'New password (min 8 characters)' })
  @ValidateIf(
    (o: UpdateUserDto) =>
      typeof o.password === 'string' && o.password.length > 0,
  )
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;

  @ApiPropertyOptional({ example: 'jane@example.com' })
  @IsOptional()
  @ValidateIf((o: UpdateUserDto) => o.email != null && o.email !== '')
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({ example: 'uuid-of-school', description: 'School ID to link user to' })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional({ description: 'snake_case alias for schoolId' })
  @IsOptional()
  @IsString()
  school_id?: string | null;

  @ApiPropertyOptional({ example: 'uuid-of-branch', description: 'Branch ID to link user to' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'snake_case alias for branchId' })
  @IsOptional()
  @IsString()
  branch_id?: string | null;

  @ApiPropertyOptional({
    description:
      'Admin-only role change. Accepts enum values or lowercase legacy strings (e.g. director).',
    enum: UserRole,
  })
  @IsOptional()
  @IsString()
  role?: string | null;

  @ApiPropertyOptional({ description: 'Teacher profile: hire date (ISO or YYYY-MM-DD)' })
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
  background_check_date?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  background_check_expiry?: string | null;

  @ApiPropertyOptional({ description: 'e.g. active / ACTIVE' })
  @IsOptional()
  @IsString()
  employment_status?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}

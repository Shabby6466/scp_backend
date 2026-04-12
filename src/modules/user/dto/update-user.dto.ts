import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane Smith', description: 'Updated full name' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name?: string;

  @ApiPropertyOptional({ example: 'NewSecretPassword123', description: 'New password (min 8 characters)' })
  @ValidateIf(
    (o: UpdateUserDto) =>
      typeof o.password === 'string' && o.password.length > 0,
  )
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;

  @ApiPropertyOptional({ example: 'uuid-of-school', description: 'School ID to link user to' })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-branch', description: 'Branch ID to link user to' })
  @IsOptional()
  @IsString()
  branchId?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../common/enums/database.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'jane.doe@example.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Jane Doe', description: 'User full name' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.TEACHER, description: 'User role' })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({ example: 'uuid-of-school', description: 'School ID (if applicable)' })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-branch', description: 'Branch ID (if applicable)' })
  @IsOptional()
  @IsString()
  branchId?: string;
}

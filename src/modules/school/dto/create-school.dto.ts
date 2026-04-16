import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSchoolDto {
  @ApiProperty({ example: 'Greenwood Heights School', description: 'Name of the school' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ example: 'uuid-of-director', description: 'ID of the school director user' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  directorUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string | null;

  @ApiPropertyOptional({ description: 'zip_code (snake_case) accepted for backward compatibility' })
  @IsOptional()
  @IsString()
  zip_code?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipCode?: string | null;

  @ApiPropertyOptional({ description: 'is_approved (snake_case) accepted for backward compatibility' })
  @IsOptional()
  @IsBoolean()
  is_approved?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @ApiPropertyOptional({ description: 'approved_at (snake_case ISO date) accepted for backward compatibility' })
  @IsOptional()
  @IsDateString()
  approved_at?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  approvedAt?: string | null;
}

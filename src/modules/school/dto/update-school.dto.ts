import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateSchoolDto {
  @ApiPropertyOptional({ example: 'Updated School Name', description: 'Updated name of the school' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
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

  @ApiPropertyOptional({ description: 'snake_case alias for zipCode' })
  @IsOptional()
  @IsString()
  zip_code?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipCode?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  website?: string | null;

  @ApiPropertyOptional({ description: 'snake_case alias for minAge' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_age?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minAge?: number | null;

  @ApiPropertyOptional({ description: 'snake_case alias for maxAge' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_age?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxAge?: number | null;

  @ApiPropertyOptional({ description: 'snake_case alias for totalCapacity' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  total_capacity?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalCapacity?: number | null;

  @ApiPropertyOptional({ description: 'snake_case alias for licenseNumber' })
  @IsOptional()
  @IsString()
  license_number?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseNumber?: string | null;

  @ApiPropertyOptional({ description: 'snake_case alias for certificationNumber' })
  @IsOptional()
  @IsString()
  certification_number?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certificationNumber?: string | null;

  @ApiPropertyOptional({ description: 'snake_case alias for primaryColor' })
  @IsOptional()
  @IsString()
  primary_color?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryColor?: string | null;

  @ApiPropertyOptional({ description: 'snake_case alias for logoUrl' })
  @IsOptional()
  @IsString()
  logo_url?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @ApiPropertyOptional({ description: 'snake_case alias for isApproved' })
  @IsOptional()
  @IsBoolean()
  is_approved?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @ApiPropertyOptional({ description: 'snake_case alias for approvedAt' })
  @IsOptional()
  @IsDateString()
  approved_at?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  approvedAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvedBy?: string | null;
}

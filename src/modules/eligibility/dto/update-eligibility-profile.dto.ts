import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateEligibilityProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  educationLevel?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  educationField?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  totalCredits?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  eceCredits?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsExperience?: number | null;

  @ApiPropertyOptional({ description: 'Storage key/path for resume file.' })
  @IsOptional()
  @IsString()
  resumePath?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cdaCredential?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  stateCertification?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  firstAidCertified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cprCertified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  languages?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}


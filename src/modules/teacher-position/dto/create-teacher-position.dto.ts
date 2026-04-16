import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateTeacherPositionDto {
  @ApiProperty({ example: '6a2d2a4d-1f5d-4f6f-9f8d-4ac9f3b3b4b1' })
  @IsUUID()
  schoolId!: string;

  @ApiProperty({ example: 'Lead Teacher' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Room lead; ECE credits required.' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'Associate' })
  @IsOptional()
  @IsString()
  minEducationLevel?: string | null;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minCredits?: number | null;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minEceCredits?: number | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minYearsExperience?: number | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  requiresCda?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  requiresStateCert?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


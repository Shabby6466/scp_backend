import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateComplianceCategoryDto {
  @ApiProperty({ example: 'Health & Safety', description: 'Name of the compliance category' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'health-safety', description: 'Unique slug for the category' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiPropertyOptional({ example: 'Documents related to health and safety regulations', description: 'Description of the category' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'shield-check', description: 'Icon name or identifier' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 1, description: 'Display order of the category' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: 'uuid-of-school', description: 'Filter by school ID' })
  @IsOptional()
  @IsString()
  schoolId?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateComplianceCategoryDto {
  @ApiPropertyOptional({ example: 'Updated Category Name', description: 'Updated name of the category' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description for this category', description: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'shield-check-alt', description: 'Updated icon identifier' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 2, description: 'Updated display order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

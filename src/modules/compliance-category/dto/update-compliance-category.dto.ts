import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateComplianceCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateSchoolDto {
  @ApiPropertyOptional({ example: 'Updated School Name', description: 'Updated name of the school' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

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
}

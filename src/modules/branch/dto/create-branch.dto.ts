import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'Main Branch', description: 'Name of the branch' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ example: 'uuid-of-director', description: 'ID of the branch director user' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  branchDirectorUserId?: string;
}

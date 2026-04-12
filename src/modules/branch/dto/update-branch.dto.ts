import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateBranchDto {
  @ApiPropertyOptional({ example: 'Updated Branch Name', description: 'Updated name of the branch' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: 'uuid-of-director', description: 'ID of the branch director user' })
  @IsOptional()
  @IsString()
  branchDirectorUserId?: string;
}

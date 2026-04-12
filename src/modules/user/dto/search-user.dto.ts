import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole, StaffPosition } from '../../common/enums/database.enum';
import { Transform } from 'class-transformer';

export class SearchUserDto {
  @ApiPropertyOptional({ example: 'John', description: 'Search query for name or email' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.TEACHER, description: 'Filter by user role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: 'uuid-of-branch', description: 'Filter by branch ID' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ enum: StaffPosition, example: StaffPosition.LEAD_TEACHER, description: 'Filter by staff position' })
  @IsOptional()
  @IsEnum(StaffPosition)
  staffPosition?: StaffPosition;

  @ApiPropertyOptional({ example: true, description: 'Filter by staff clearance status' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  staffClearanceActive?: boolean;

  @ApiPropertyOptional({ example: 'uuid-of-school', description: 'Filter by school ID' })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number for pagination' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Number of items per page' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;
}

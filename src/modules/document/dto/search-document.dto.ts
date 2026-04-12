import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../common/enums/database.enum';
import { Transform } from 'class-transformer';

/** Query params for `GET /documents/search` (includes CRM-style `status` + paging). */
export class SearchDocumentDto {
  @ApiPropertyOptional({ example: 'clearance', description: 'Search query for filename' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ example: 'uuid-of-school', description: 'Filter by school ID' })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-branch', description: 'Filter by branch ID' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-document-type', description: 'Filter by document type ID' })
  @IsOptional()
  @IsString()
  documentTypeId?: string;

  @ApiPropertyOptional({ example: true, description: 'Filter by verification status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || (value === 'false' || value === false ? false : undefined))
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.TEACHER, description: 'Filter by owner role' })
  @IsOptional()
  @IsEnum(UserRole)
  ownerRole?: UserRole;

  @ApiPropertyOptional({ example: 'pending', description: 'CRM-style status (e.g., pending, approved)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 10, description: 'Number of items per page' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;

  @ApiPropertyOptional({ example: 0, description: 'Offset for pagination' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number;
}

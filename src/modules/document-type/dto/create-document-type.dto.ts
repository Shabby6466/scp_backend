import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RenewalPeriod, UserRole } from '../../common/enums/database.enum';

export class CreateDocumentTypeDto {
  @ApiProperty({ example: 'Fingerprint Clearance', description: 'Name of the document type' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.TEACHER, description: 'Target role for this document' })
  @IsEnum(UserRole)
  targetRole!: UserRole;

  @ApiPropertyOptional({ enum: RenewalPeriod, example: RenewalPeriod.ANNUAL, description: 'Renewal period' })
  @IsOptional()
  @IsEnum(RenewalPeriod)
  renewalPeriod?: RenewalPeriod;

  @ApiPropertyOptional({ example: 'uuid-of-school', description: 'School ID' })
  @IsOptional()
  @IsString()
  schoolId?: string;

  /** Platform admin only: scope to a branch (must belong to `schoolId`). */
  @ApiPropertyOptional({ example: 'uuid-of-branch', description: 'Branch ID' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-category', description: 'Compliance category ID' })
  @IsOptional()
  @IsString()
  complianceCategoryId?: string;
}

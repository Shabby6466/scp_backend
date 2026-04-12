import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { RenewalPeriod, UserRole } from '../../common/enums/database.enum';

export class UpdateDocumentTypeDto {
  @ApiPropertyOptional({ example: 'Updated Document Name', description: 'Updated name of the document type' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: RenewalPeriod, example: RenewalPeriod.BIENNIAL, description: 'Updated renewal period' })
  @IsOptional()
  @IsEnum(RenewalPeriod)
  renewalPeriod?: RenewalPeriod;

  @ApiPropertyOptional({ example: true, description: 'Whether the document is mandatory' })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.TEACHER, description: 'Updated target role' })
  @IsOptional()
  @IsEnum(UserRole)
  targetRole?: UserRole;

  @ApiPropertyOptional({ example: 'uuid-of-category', description: 'Updated compliance category ID (null to clear)' })
  @IsOptional()
  @IsString()
  complianceCategoryId?: string | null;
}

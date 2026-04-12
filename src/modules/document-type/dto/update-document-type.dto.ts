import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { RenewalPeriod, UserRole } from '../../common/enums/database.enum';

export class UpdateDocumentTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(RenewalPeriod)
  renewalPeriod?: RenewalPeriod;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @IsOptional()
  @IsEnum(UserRole)
  targetRole?: UserRole;

  @IsOptional()
  @IsString()
  complianceCategoryId?: string | null;
}

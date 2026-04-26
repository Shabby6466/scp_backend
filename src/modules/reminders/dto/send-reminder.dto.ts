import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class SendReminderDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  threshold!: number;

  @IsOptional()
  @IsBoolean()
  includeExpired?: boolean;

  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;
}

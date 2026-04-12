import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export type FormsBucket = 'day' | 'week' | 'month';

export class FormsAnalyticsQueryDto {
  @ApiProperty({ example: '2025-01-01', description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  from!: string;

  @ApiProperty({ example: '2025-01-31', description: 'End date (YYYY-MM-DD)' })
  @IsDateString()
  to!: string;

  @ApiProperty({ enum: ['day', 'week', 'month'], example: 'day', description: 'Time bucket for aggregation' })
  @IsEnum(['day', 'week', 'month'])
  bucket!: FormsBucket;

  @ApiPropertyOptional({ example: 'uuid-of-document-type', description: 'Filter by specific document type ID' })
  @IsOptional()
  @IsString()
  documentTypeId?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CompleteDocumentDto {
  @ApiProperty({ example: 'uuid-of-owner', description: 'ID of the user who owns the document' })
  @IsString()
  @IsNotEmpty()
  ownerUserId!: string;

  @ApiProperty({ example: 'uuid-of-document-type', description: 'ID of the document type' })
  @IsString()
  @IsNotEmpty()
  documentTypeId!: string;

  @ApiProperty({ example: 'documents/uuid/filename.pdf', description: 'S3 key of the uploaded file' })
  @IsString()
  @IsNotEmpty()
  s3Key!: string;

  @ApiProperty({ example: 'clearance_certificate.pdf', description: 'Original filename' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ example: 'application/pdf', description: 'MIME type of the file' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({ example: 1048576, description: 'File size in bytes' })
  @IsInt()
  @Min(1)
  sizeBytes!: number;

  @ApiPropertyOptional({ example: '2027-12-31', description: 'Expiration date of the document (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  expiresAt?: string;

  @ApiPropertyOptional({ example: '2025-01-01', description: 'Issuance date of the document (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  issuedAt?: string;
}

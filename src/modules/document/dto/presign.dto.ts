import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class PresignDto {
  @ApiProperty({ example: 'uuid-of-owner', description: 'ID of the user who owns the document' })
  @IsString()
  @IsNotEmpty()
  ownerUserId!: string;

  @ApiProperty({ example: 'uuid-of-document-type', description: 'ID of the document type' })
  @IsString()
  @IsNotEmpty()
  documentTypeId!: string;

  @ApiProperty({ example: 'clearance_certificate.pdf', description: 'Original filename for the file' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ example: 'application/pdf', description: 'MIME type of the file' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiPropertyOptional({
    description:
      'When uploading a document for an enrolled child, set this to the student profile id (acting user stays ownerUserId).',
  })
  @IsOptional()
  @IsUUID()
  studentProfileId?: string;
}

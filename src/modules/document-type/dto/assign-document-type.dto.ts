import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AssignDocumentTypeDto {
  @ApiProperty({ 
    example: ['uuid-of-user-1', 'uuid-of-user-2'], 
    description: 'Array of user IDs to assign this document type to',
    type: [String]
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  userIds!: string[];
}

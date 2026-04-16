import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class RequiredDocTypeCountsDto {
  @ApiProperty({
    type: [String],
    description: 'Student profile UUIDs (merged school-wide + branch requirement counts per id)',
  })
  @IsArray()
  @ArrayMaxSize(5000)
  @IsUUID('4', { each: true })
  studentProfileIds!: string[];
}

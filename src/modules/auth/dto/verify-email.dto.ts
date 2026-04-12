import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '123456', description: '6-digit verification code' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code?: string;

  @ApiPropertyOptional({ example: 'a-long-token-string', description: 'Verification token from email link' })
  @IsOptional()
  @IsString()
  @MinLength(32, { message: 'Invalid token' })
  token?: string;

  @ApiPropertyOptional({ example: 'NewPassword123', description: 'New password if setting it during verification' })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;
}

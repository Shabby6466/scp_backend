import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAppSettingsDto {
  @ApiPropertyOptional({ example: true, description: 'Whether OTP email verification is enabled' })
  @IsOptional()
  @IsBoolean()
  otpEmailVerificationEnabled?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Whether self-registration is enabled' })
  @IsOptional()
  @IsBoolean()
  selfRegistrationEnabled?: boolean;
}

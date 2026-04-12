import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, VerifyEmailDto } from './dto/index';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

interface RequestUser {
  id: string;
  email: string;
  role: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @ApiOperation({ summary: 'Log in as a user' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Register a new user' })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Verify email with OTP or token' })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() body: { email: string }) {
    await this.authService.resendVerification(body.email);
    return { message: 'Verification code sent' };
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: RequestUser) {
    return this.authService.getProfile(user.id);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    return { message: 'Logged out' };
  }
}

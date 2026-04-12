import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';
import { SettingsModule } from '../settings/settings.module';
import { MailerModule } from '../mailer/mailer.module';
import { User } from '../../entities/user.entity';
import { AuthOtp } from '../../entities/auth-otp.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuthOtp]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRATION') || '7d') as any,
        },
      }),
    }),
    forwardRef(() => UserModule),
    SettingsModule,
    MailerModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule { }

import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('AppConfig')
export class AppConfig extends BaseEntity {
  @Column({ name: 'otp_email_verification_enabled', default: true,
      type: 'boolean'
})
  otpEmailVerificationEnabled!: boolean;

  @Column({ name: 'self_registration_enabled', default: true,
      type: 'boolean'
})
  selfRegistrationEnabled!: boolean;
}

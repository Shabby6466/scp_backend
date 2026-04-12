import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('AuthOtp')
export class AuthOtp extends BaseEntity {
  @Column({ name: 'email',
      type: 'varchar'
})
  @Index()
  email!: string;

  @Column({ name: 'code_hash',
      type: 'varchar'
})
  codeHash!: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  @Index()
  expiresAt!: Date;

  @Column({ name: 'consumed_at', type: 'timestamp', nullable: true })
  consumedAt!: Date | null;
}

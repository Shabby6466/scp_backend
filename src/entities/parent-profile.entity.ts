import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('ParentProfile')
export class ParentProfile extends BaseEntity {
  @Column({ name: 'phone', nullable: true , type: 'varchar' })
  phone!: string | null;

  @Column({ name: 'address', type: 'text', nullable: true })
  address!: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @OneToOne(() => User, (user) => user.parentProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

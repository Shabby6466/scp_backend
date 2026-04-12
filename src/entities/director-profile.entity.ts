import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('DirectorProfile')
export class DirectorProfile extends BaseEntity {
  @Column({ name: 'user_id', unique: true,
      type: 'varchar'
})
  userId!: string;

  @Column({ name: 'office_phone', nullable: true , type: 'varchar' })
  officePhone!: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @OneToOne(() => User, (user) => user.directorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

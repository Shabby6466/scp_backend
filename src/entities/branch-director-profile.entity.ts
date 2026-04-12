import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('BranchDirectorProfile')
export class BranchDirectorProfile extends BaseEntity {
  @Column({ name: 'user_id', unique: true,
      type: 'varchar'
})
  userId!: string;

  @Column({ name: 'branch_start_date', type: 'timestamp', nullable: true })
  branchStartDate!: Date | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @OneToOne(() => User, (user) => user.branchDirectorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserRole, InvitationStatus } from '../modules/common/enums/database.enum';
import { School } from './school.entity';
import { Branch } from './branch.entity';
import { User } from './user.entity';

@Entity('Invitation')
export class Invitation extends BaseEntity {
  @Column({ name: 'email',
      type: 'varchar'
})
  @Index()
  email!: string;

  @Column({ name: 'role', type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ name: 'token', unique: true,
      type: 'varchar'
})
  @Index()
  token!: string;

  @Column({ name: 'status', type: 'enum', enum: InvitationStatus, default: InvitationStatus.PENDING })
  status!: InvitationStatus;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
  acceptedAt!: Date | null;

  @Column({ name: 'school_id',
      type: 'varchar'
})
  @Index()
  schoolId!: string;

  @Column({ name: 'branch_id', nullable: true , type: 'varchar' })
  @Index()
  branchId!: string | null;

  @Column({ name: 'sent_by_id',
      type: 'varchar'
})
  @Index()
  sentById!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @ManyToOne(() => Branch, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sent_by_id' })
  sentBy!: User;
}

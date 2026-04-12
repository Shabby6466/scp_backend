import { BaseEntity } from './base.entity';
import { School } from './school.entity';
import { User } from './user.entity';
import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';


@Entity('Branch')
export class Branch extends BaseEntity {
  @Column({ name: 'name',
      type: 'varchar'
})
  name!: string;

  @Column({
    name: 'school_id',
    type: 'uuid'
  })
  @Index()
  schoolId!: string;

  @Column({ name: 'address', nullable: true , type: 'varchar' })
  address!: string | null;

  @Column({ name: 'city', nullable: true , type: 'varchar' })
  city!: string | null;

  @Column({ name: 'state', nullable: true , type: 'varchar' })
  state!: string | null;

  @Column({ name: 'zip_code', nullable: true , type: 'varchar' })
  zipCode!: string | null;

  @Column({ name: 'phone', nullable: true , type: 'varchar' })
  phone!: string | null;

  @Column({ name: 'email', nullable: true , type: 'varchar' })
  email!: string | null;

  @Column({ name: 'min_age', nullable: true , type: 'int' })
  minAge!: number | null;

  @Column({ name: 'max_age', nullable: true , type: 'int' })
  maxAge!: number | null;

  @Column({ name: 'total_capacity', nullable: true , type: 'int' })
  totalCapacity!: number | null;

  @Column({ name: 'is_primary', default: false,
      type: 'boolean'
})
  isPrimary!: boolean;

  @Column({ name: 'is_active', default: true,
      type: 'boolean'
})
  isActive!: boolean;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'deleted_by', nullable: true, type: 'uuid' })
  deletedBy!: string | null;

  @ManyToOne(() => School, (school) => school.branches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @OneToMany(() => User, (user) => user.branch)
  users!: User[];
}

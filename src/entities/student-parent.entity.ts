import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('StudentParent')
@Unique(['studentId', 'parentId'])
export class StudentParent extends BaseEntity {
  @Column({ name: 'student_id',
      type: 'varchar'
})
  @Index()
  studentId!: string;

  @Column({ name: 'parent_id',
      type: 'varchar'
})
  @Index()
  parentId!: string;

  @Column({ name: 'relation', nullable: true , type: 'varchar' })
  relation!: string | null;

  @Column({ name: 'is_primary', default: false,
      type: 'boolean'
})
  isPrimary!: boolean;

  @ManyToOne(() => User, (user) => user.studentLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: User;

  @ManyToOne(() => User, (user) => user.parentLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent!: User;
}

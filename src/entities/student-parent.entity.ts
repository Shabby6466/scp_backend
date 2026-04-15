import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { StudentProfile } from './student-profile.entity';

@Entity('StudentParent')
@Unique(['studentProfileId', 'parentId'])
export class StudentParent extends BaseEntity {
  @Column({ name: 'student_profile_id', type: 'uuid' })
  @Index()
  studentProfileId!: string;

  @Column({ name: 'parent_id', type: 'uuid' })
  @Index()
  parentId!: string;

  @Column({ name: 'relation', nullable: true, type: 'varchar' })
  relation!: string | null;

  @Column({ name: 'is_primary', default: false, type: 'boolean' })
  isPrimary!: boolean;

  @ManyToOne(() => StudentProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_profile_id' })
  studentProfile!: StudentProfile;

  @ManyToOne(() => User, (user) => user.parentLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent!: User;
}

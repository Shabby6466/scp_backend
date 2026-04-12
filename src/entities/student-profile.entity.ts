import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('StudentProfile')
export class StudentProfile extends BaseEntity {
  @Column({ name: 'user_id', unique: true,
      type: 'varchar'
})
  userId!: string;

  @Column({ name: 'first_name', nullable: true , type: 'varchar' })
  firstName!: string | null;

  @Column({ name: 'last_name', nullable: true , type: 'varchar' })
  lastName!: string | null;

  @Column({ name: 'date_of_birth', type: 'timestamp', nullable: true })
  dateOfBirth!: Date | null;

  @Column({ name: 'grade_level', nullable: true , type: 'varchar' })
  gradeLevel!: string | null;

  @Column({ name: 'roll_number', nullable: true , type: 'varchar' })
  rollNumber!: string | null;

  @Column({ name: 'guardian_name', nullable: true , type: 'varchar' })
  guardianName!: string | null;

  @Column({ name: 'guardian_phone', nullable: true , type: 'varchar' })
  guardianPhone!: string | null;

  @Column({ name: 'deleted_by', nullable: true , type: 'varchar' })
  deletedBy!: string | null;

  @OneToOne(() => User, (user) => user.studentProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

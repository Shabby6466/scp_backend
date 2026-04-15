import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { School } from './school.entity';
import { Branch } from './branch.entity';

@Entity('StudentProfile')
export class StudentProfile extends BaseEntity {
  @Column({ name: 'first_name', nullable: true, type: 'varchar' })
  firstName!: string | null;

  @Column({ name: 'last_name', nullable: true, type: 'varchar' })
  lastName!: string | null;

  @Column({ name: 'date_of_birth', type: 'timestamp', nullable: true })
  dateOfBirth!: Date | null;

  @Column({ name: 'grade_level', nullable: true, type: 'varchar' })
  gradeLevel!: string | null;

  @Column({ name: 'roll_number', nullable: true, type: 'varchar' })
  rollNumber!: string | null;

  @Column({ name: 'guardian_name', nullable: true, type: 'varchar' })
  guardianName!: string | null;

  @Column({ name: 'guardian_phone', nullable: true, type: 'varchar' })
  guardianPhone!: string | null;

  @Column({ name: 'deleted_by', nullable: true, type: 'varchar' })
  deletedBy!: string | null;

  @Column({ name: 'school_id', nullable: true, type: 'uuid' })
  @Index()
  schoolId!: string | null;

  @Column({ name: 'branch_id', nullable: true, type: 'uuid' })
  @Index()
  branchId!: string | null;

  @ManyToOne(() => School, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School | null;

  @ManyToOne(() => Branch, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch | null;
}

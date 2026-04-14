import { Entity, Column, OneToOne, JoinColumn, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { TeacherPosition } from './teacher-position.entity';
import {
  EmploymentStatus,
  PgEnumName,
} from '../modules/common/enums/database.enum';

@Entity('TeacherProfile')
export class TeacherProfile extends BaseEntity {
  @Column({ name: 'user_id', unique: true,
      type: 'varchar'
})
  userId!: string;

  @Column({ name: 'subject_area', nullable: true , type: 'varchar' })
  subjectArea!: string | null;

  @Column({ name: 'employee_code', nullable: true , type: 'varchar' })
  employeeCode!: string | null;

  @Column({ name: 'joining_date', type: 'timestamp', nullable: true })
  joiningDate!: Date | null;

  @Column({ name: 'phone', nullable: true , type: 'varchar' })
  phone!: string | null;

  @Column({ name: 'hire_date', type: 'timestamp', nullable: true })
  hireDate!: Date | null;

  @Column({
    name: 'employment_status',
    type: 'enum',
    enum: EmploymentStatus,
    enumName: PgEnumName.EmploymentStatus,
    default: EmploymentStatus.ACTIVE,
  })
  employmentStatus!: EmploymentStatus;

  @Column({ name: 'certification_type', nullable: true , type: 'varchar' })
  certificationType!: string | null;

  @Column({ name: 'certification_expiry', type: 'timestamp', nullable: true })
  certificationExpiry!: Date | null;

  @Column({ name: 'background_check_date', type: 'timestamp', nullable: true })
  backgroundCheckDate!: Date | null;

  @Column({ name: 'background_check_expiry', type: 'timestamp', nullable: true })
  backgroundCheckExpiry!: Date | null;

  @Column({ name: 'position_id', nullable: true , type: 'varchar' })
  @Index()
  positionId!: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @OneToOne(() => User, (user) => user.teacherProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => TeacherPosition, (position) => position.teachers, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'position_id' })
  position!: TeacherPosition | null;
}

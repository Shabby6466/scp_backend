import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { School } from './school.entity';
import { TeacherProfile } from './teacher-profile.entity';

@Entity('TeacherPosition')
export class TeacherPosition extends BaseEntity {
  @Column({ name: 'school_id',
      type: 'varchar'
})
  @Index()
  schoolId!: string;

  @Column({ name: 'name',
      type: 'varchar'
})
  name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'min_education_level', nullable: true , type: 'varchar' })
  minEducationLevel!: string | null;

  @Column({ name: 'min_credits', nullable: true , type: 'int' })
  minCredits!: number | null;

  @Column({ name: 'min_ece_credits', nullable: true , type: 'int' })
  minEceCredits!: number | null;

  @Column({ name: 'min_years_experience', nullable: true , type: 'int' })
  minYearsExperience!: number | null;

  @Column({ name: 'requires_cda', default: false,
      type: 'boolean'
})
  requiresCda!: boolean;

  @Column({ name: 'requires_state_cert', default: false,
      type: 'boolean'
})
  requiresStateCert!: boolean;

  @Column({ name: 'is_active', default: true,
      type: 'boolean'
})
  isActive!: boolean;

  @ManyToOne(() => School, (school) => school.teacherPositions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @OneToMany(() => TeacherProfile, (profile) => profile.position)
  teachers!: TeacherProfile[];
}

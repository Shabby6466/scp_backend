import { Entity, Column, OneToOne, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { School } from './school.entity';

@Entity('TeacherEligibilityProfile')
export class TeacherEligibilityProfile extends BaseEntity {
  @Column({ name: 'user_id', unique: true, type: 'uuid' })
  userId!: string;

  @Column({ name: 'school_id', type: 'uuid' })
  @Index()
  schoolId!: string;

  @Column({ name: 'education_level', nullable: true , type: 'varchar' })
  educationLevel!: string | null;

  @Column({ name: 'education_field', nullable: true , type: 'varchar' })
  educationField!: string | null;

  @Column({ name: 'total_credits', nullable: true , type: 'int' })
  totalCredits!: number | null;

  @Column({ name: 'ece_credits', nullable: true , type: 'int' })
  eceCredits!: number | null;

  @Column({ name: 'years_experience', nullable: true , type: 'int' })
  yearsExperience!: number | null;

  @Column({ name: 'resume_path', nullable: true , type: 'varchar' })
  resumePath!: string | null;

  @Column({ name: 'cda_credential', default: false,
      type: 'boolean'
})
  cdaCredential!: boolean;

  @Column({ name: 'state_certification', default: false,
      type: 'boolean'
})
  stateCertification!: boolean;

  @Column({ name: 'first_aid_certified', default: false,
      type: 'boolean'
})
  firstAidCertified!: boolean;

  @Column({ name: 'cpr_certified', default: false,
      type: 'boolean'
})
  cprCertified!: boolean;

  @Column({ name: 'languages', nullable: true , type: 'varchar' })
  languages!: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'ai_analysis', type: 'text', nullable: true })
  aiAnalysis!: string | null;

  @Column({ name: 'ai_analyzed_at', type: 'timestamp', nullable: true })
  aiAnalyzedAt!: Date | null;

  @OneToOne(() => User, (user) => user.eligibilityProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => School, (school) => school.eligibilityProfiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;
}

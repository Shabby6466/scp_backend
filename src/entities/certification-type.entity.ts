import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { School } from './school.entity';
import { CertificationRecord } from './certification-record.entity';
import { ComplianceCategory } from './compliance-category.entity';

@Entity('CertificationType')
export class CertificationType extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  @Index()
  schoolId!: string;

  /** When set, this certification template applies only to that branch. */
  @Column({ name: 'branch_id', nullable: true, type: 'uuid' })
  @Index()
  branchId!: string | null;

  @Column({ name: 'name',
      type: 'varchar'
})
  name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'default_validity_months', nullable: true , type: 'int' })
  defaultValidityMonths!: number | null;

  /** One of the school’s ComplianceCategory rows (preset slugs: certifications, doh, …). */
  @Column({ name: 'compliance_category_id', nullable: true, type: 'uuid' })
  @Index()
  complianceCategoryId!: string | null;

  @ManyToOne(() => ComplianceCategory, (cat) => cat.certificationTypes, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'compliance_category_id' })
  complianceCategory!: ComplianceCategory | null;

  @ManyToOne('School', (school: any) => school.certificationTypes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @OneToMany('CertificationRecord', (record: any) => record.certificationType)
  certificationRecords!: CertificationRecord[];
}

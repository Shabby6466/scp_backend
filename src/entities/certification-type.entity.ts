import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { School } from './school.entity';
import { CertificationRecord } from './certification-record.entity';

@Entity('CertificationType')
export class CertificationType extends BaseEntity {
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

  @Column({ name: 'default_validity_months', nullable: true , type: 'int' })
  defaultValidityMonths!: number | null;

  @ManyToOne('School', (school: any) => school.certificationTypes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @OneToMany('CertificationRecord', (record: any) => record.certificationType)
  certificationRecords!: CertificationRecord[];
}

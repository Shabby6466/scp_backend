import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { School } from './school.entity';
import { CertificationType } from './certification-type.entity';

@Entity('CertificationRecord')
export class CertificationRecord extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  @Index()
  schoolId!: string;

  /** Optional branch scope for branch-level certification tracking. */
  @Column({ name: 'branch_id', nullable: true, type: 'uuid' })
  @Index()
  branchId!: string | null;

  @Column({ name: 'certification_type_id', type: 'uuid' })
  @Index()
  certificationTypeId!: string;

  @Column({ name: 'issue_date', type: 'timestamp', nullable: true })
  issueDate!: Date | null;

  @Column({ name: 'expiry_date', type: 'timestamp', nullable: true })
  expiryDate!: Date | null;

  @Column({ name: 'reference_number', nullable: true , type: 'varchar' })
  referenceNumber!: string | null;

  @Column({ name: 'document_url', nullable: true , type: 'varchar' })
  documentUrl!: string | null;

  @ManyToOne('School', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @ManyToOne('CertificationType', (type: any) => type.certificationRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'certification_type_id' })
  certificationType!: CertificationType;
}

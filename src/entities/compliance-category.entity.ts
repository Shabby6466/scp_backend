import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { School } from './school.entity';
import { User } from './user.entity';
import { DocumentType } from './document.entity';

@Entity('ComplianceCategory')
@Unique(['schoolId', 'slug'])
export class ComplianceCategory extends BaseEntity {
  @Column({
    name: 'name',
    type: 'varchar'
  })
  name!: string;

  @Column({
    name: 'slug',
    type: 'varchar'
  })
  slug!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'icon', nullable: true, type: 'varchar' })
  icon!: string | null;

  @Column({
    name: 'sort_order', default: 0,
    type: 'int'
  })
  sortOrder!: number;

  @Column({
    name: 'school_id',
    type: 'uuid'
  })
  @Index()
  schoolId!: string;

  @Column({
    name: 'created_by_id',
    type: 'uuid'
  })
  @Index()
  createdById!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  @OneToMany(() => DocumentType, (type) => type.category)
  documentTypes!: DocumentType[];

  /** School-scoped certification templates — string names avoid circular imports with CertificationType. */
  @OneToMany('CertificationType', 'complianceCategory')
  certificationTypes!: import('./certification-type.entity').CertificationType[];

  /** Recurring inspection programs — string names avoid circular imports with InspectionType. */
  @OneToMany('InspectionType', 'complianceCategory')
  inspectionTypes!: import('./inspection-type.entity').InspectionType[];
}

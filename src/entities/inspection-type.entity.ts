import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { School } from './school.entity';
import { ComplianceCategory } from './compliance-category.entity';
import {
  InspectionCategory,
  PgEnumName,
} from '../modules/common/enums/database.enum';

@Entity('InspectionType')
export class InspectionType extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  @Index()
  schoolId!: string;

  /** When set, this inspection program applies only to that branch (otherwise school-wide). */
  @Column({ name: 'branch_id', nullable: true, type: 'uuid' })
  @Index()
  branchId!: string | null;

  @Column({ name: 'name',
      type: 'varchar'
})
  name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'frequency', nullable: true , type: 'varchar' })
  frequency!: string | null;

  @Column({
    type: 'enum',
    enum: InspectionCategory,
    enumName: PgEnumName.InspectionCategory,
    default: InspectionCategory.FACILITY_SAFETY,
  })
  category!: InspectionCategory;

  /** UI / reporting bucket — aligns with ComplianceCategory presets (doh, facility-safety, …). */
  @Column({ name: 'compliance_category_id', nullable: true, type: 'uuid' })
  @Index()
  complianceCategoryId!: string | null;

  @ManyToOne(() => ComplianceCategory, (cat) => cat.inspectionTypes, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'compliance_category_id' })
  complianceCategory!: ComplianceCategory | null;

  @ManyToOne(() => School, (school) => school.inspectionTypes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;
}

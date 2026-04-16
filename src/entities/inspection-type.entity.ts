import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { School } from './school.entity';
import {
  InspectionCategory,
  PgEnumName,
} from '../modules/common/enums/database.enum';

@Entity('InspectionType')
export class InspectionType extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  @Index()
  schoolId!: string;

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

  @ManyToOne(() => School, (school) => school.inspectionTypes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;
}

import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { School } from './school.entity';

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

  @ManyToOne(() => School, (school) => school.inspectionTypes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;
}

import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { School } from './school.entity';
import { User } from './user.entity';
import { InspectionType } from './inspection-type.entity';

@Entity('ComplianceRequirement')
export class ComplianceRequirement extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  @Index()
  schoolId!: string;

  @Column({ name: 'name', type: 'varchar' })
  name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'inspection_type_id', nullable: true, type: 'uuid' })
  @Index()
  inspectionTypeId!: string | null;

  @Column({ name: 'owner_id', nullable: true, type: 'uuid' })
  @Index()
  ownerId!: string | null;

  @Column({ name: 'created_by_id', nullable: true, type: 'uuid' })
  @Index()
  createdById!: string | null;

  @ManyToOne(() => School, (school) => school.complianceRequirements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @ManyToOne(() => InspectionType, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'inspection_type_id' })
  inspectionType!: InspectionType | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner!: User | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User | null;
}

import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Branch } from './branch.entity';
import { ComplianceRequirement } from './compliance-requirement.entity';
import { InspectionType } from './inspection-type.entity';
import { CertificationType } from './certification-type.entity';
import { TeacherPosition } from './teacher-position.entity';
import { TeacherEligibilityProfile } from './teacher-eligibility-profile.entity';

@Entity('School')
export class School extends BaseEntity {
  @Column({
    name: 'name',
    type: 'varchar'
  })
  name!: string;

  @Column({
    name: 'email', nullable: true,
    type: 'varchar'
  })
  email!: string | null;

  @Column({
    name: 'phone', nullable: true,
    type: 'varchar'
  })
  phone!: string | null;

  @Column({
    name: 'address', nullable: true,
    type: 'varchar'
  })
  address!: string | null;

  @Column({
    name: 'city', nullable: true,
    type: 'varchar'
  })
  city!: string | null;

  @Column({
    name: 'state', nullable: true,
    type: 'varchar'
  })
  state!: string | null;

  @Column({
    name: 'zip_code', nullable: true,
    type: 'varchar'
  })
  zipCode!: string | null;

  @Column({
    name: 'website', nullable: true,
    type: 'varchar'
  })
  website!: string | null;

  @Column({
    name: 'license_number', nullable: true,
    type: 'varchar'
  })
  licenseNumber!: string | null;

  @Column({
    name: 'certification_number', nullable: true,
    type: 'varchar'
  })
  certificationNumber!: string | null;

  @Column({
    name: 'min_age', nullable: true,
    type: 'int'
  })
  minAge!: number | null;

  @Column({
    name: 'max_age', nullable: true,
    type: 'int'
  })
  maxAge!: number | null;

  @Column({
    name: 'total_capacity', nullable: true,
    type: 'int'
  })
  totalCapacity!: number | null;

  @Column({
    name: 'primary_color', nullable: true,
    type: 'varchar'
  })
  primaryColor!: string | null;

  @Column({
    name: 'logo_url', nullable: true,
    type: 'varchar'
  })
  logoUrl!: string | null;

  @Column({
    name: 'is_approved', default: false,
    type: 'boolean'
  })
  isApproved!: boolean;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt!: Date | null;

  @Column({
    name: 'approved_by', nullable: true,
    type: 'varchar'
  })
  approvedBy!: string | null;

  @Column({
    name: 'deleted_by', nullable: true,
    type: 'varchar'
  })
  deletedBy!: string | null;

  @OneToMany('User', (user: any) => user.school)
  users!: User[];

  @OneToMany('Branch', (branch: any) => branch.school)
  branches!: Branch[];

  @OneToMany('ComplianceRequirement', (req: any) => req.school)
  complianceRequirements!: ComplianceRequirement[];

  @OneToMany('InspectionType', (type: any) => type.school)
  inspectionTypes!: InspectionType[];

  @OneToMany('CertificationType', (type: any) => type.school)
  certificationTypes!: CertificationType[];

  @OneToMany('TeacherPosition', (pos: any) => pos.school)
  teacherPositions!: TeacherPosition[];

  @OneToMany('TeacherEligibilityProfile', (profile: any) => profile.school)
  eligibilityProfiles!: TeacherEligibilityProfile[];
}

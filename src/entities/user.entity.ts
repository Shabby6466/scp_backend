import { Entity, Column, ManyToOne, OneToMany, OneToOne, JoinColumn, Index, ManyToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import {
  PgEnumName,
  StaffPosition,
  UserRole,
} from '../modules/common/enums/database.enum';
import { School } from './school.entity';
import { Branch } from './branch.entity';
import { Document, DocumentType } from './document.entity';
import { DirectorProfile } from './director-profile.entity';
import { BranchDirectorProfile } from './branch-director-profile.entity';
import { TeacherProfile } from './teacher-profile.entity';
import { ParentProfile } from './parent-profile.entity';
import { TeacherEligibilityProfile } from './teacher-eligibility-profile.entity';
import { StudentParent } from './student-parent.entity';

@Entity('User')
export class User extends BaseEntity {
  @Column({ name: 'email', unique: true,
      type: 'varchar'
})
  @Index()
  email!: string;

  @Column({ name: 'password', nullable: true, select: false , type: 'varchar' })
  password?: string | null;

  @Column({ name: 'name', nullable: true , type: 'varchar' })
  name!: string | null;

  @Column({ name: 'phone', nullable: true , type: 'varchar' })
  phone!: string | null;

  @Column({
    name: 'role',
    type: 'enum',
    enum: UserRole,
    enumName: PgEnumName.UserRole,
  })
  @Index()
  role!: UserRole;

  @Column('enum', {
    name: 'authorities',
    enum: UserRole,
    enumName: PgEnumName.UserRole,
    array: true,
    default: [],
  })
  authorities!: UserRole[];

  @Column({ name: 'school_id', nullable: true, type: 'uuid' })
  schoolId!: string | null;

  @Column({ name: 'branch_id', nullable: true, type: 'uuid' })
  branchId!: string | null;

  @Column({ name: 'assigned_by_id', nullable: true, type: 'uuid' })
  assignedById!: string | null;

  @Column({
    name: 'staff_position',
    type: 'enum',
    enum: StaffPosition,
    enumName: PgEnumName.StaffPosition,
    nullable: true,
  })
  staffPosition!: StaffPosition | null;

  @Column({ name: 'staff_clearance_active', default: false,
      type: 'boolean'
})
  staffClearanceActive!: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ name: 'deleted_by', nullable: true, type: 'uuid' })
  deletedBy!: string | null;

  @ManyToOne(() => School, (school) => school.users, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @ManyToOne(() => Branch, (branch) => branch.users, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @ManyToOne(() => User, (user) => user.assignedUsers, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_by_id' })
  assignedBy!: User;

  @OneToMany(() => User, (user) => user.assignedBy)
  assignedUsers!: User[];

  @OneToOne(() => DirectorProfile, (profile) => profile.user)
  directorProfile!: DirectorProfile;

  @OneToOne(() => BranchDirectorProfile, (profile) => profile.user)
  branchDirectorProfile!: BranchDirectorProfile;

  @OneToOne(() => TeacherProfile, (profile) => profile.user)
  teacherProfile!: TeacherProfile;

  @OneToOne(() => ParentProfile, (profile) => profile.user)
  parentProfile!: ParentProfile;

  @OneToOne(() => TeacherEligibilityProfile, (profile) => profile.user)
  eligibilityProfile!: TeacherEligibilityProfile;

  @OneToMany(() => StudentParent, (link) => link.parent)
  parentLinks!: StudentParent[];

  @OneToMany(() => Document, (doc) => doc.ownerUser)
  documents!: Document[];

  @OneToMany(() => Document, (doc) => doc.uploadedBy)
  uploadedDocuments!: Document[];

  @ManyToMany(() => DocumentType, (type) => type.requiredUsers)
  requiredDocTypes!: DocumentType[];
}

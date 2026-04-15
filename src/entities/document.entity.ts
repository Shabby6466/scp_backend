import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from './base.entity';
import {
  PgEnumName,
  RenewalPeriod,
  UserRole,
} from '../modules/common/enums/database.enum';
import { User } from './user.entity';
import { StudentProfile } from './student-profile.entity';
import { ComplianceCategory } from './compliance-category.entity';

@Entity('DocumentType')
export class DocumentType extends BaseEntity {
  @Column({ name: 'name',
      type: 'varchar'
})
  name!: string;

  @Column({
    name: 'target_role',
    type: 'enum',
    enum: UserRole,
    enumName: PgEnumName.UserRole,
  })
  targetRole!: UserRole;

  @Column({ name: 'is_mandatory', default: false,
      type: 'boolean'
})
  isMandatory!: boolean;

  @Column({
    name: 'renewal_period',
    type: 'enum',
    enum: RenewalPeriod,
    enumName: PgEnumName.RenewalPeriod,
    default: RenewalPeriod.NONE,
  })
  renewalPeriod!: RenewalPeriod;

  @Column({ name: 'sort_order', default: 0,
      type: 'int'
})
  sortOrder!: number;

  @Column({ name: 'school_id', nullable: true, type: 'uuid' })
  @Index()
  schoolId!: string | null;

  @Column({ name: 'branch_id', nullable: true, type: 'uuid' })
  @Index()
  branchId!: string | null;

  @Column({ name: 'created_by_id', nullable: true, type: 'uuid' })
  @Index()
  createdById!: string | null;

  @Column({ name: 'category_id', nullable: true, type: 'uuid' })
  @Index()
  categoryId!: string | null;

  @ManyToOne(() => ComplianceCategory, (cat) => cat.documentTypes, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category!: ComplianceCategory | null;

  @OneToMany(() => Document, (doc) => doc.documentType)
  documents!: Document[];

  @ManyToMany(() => User, (user) => user.id)
  @JoinTable({
    name: 'UserRequiredDocumentType',
    joinColumn: { name: 'document_type_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  requiredUsers!: User[];
}

@Entity('Document')
export class Document extends BaseEntity {
  @Column({
    name: 'owner_user_id',
    type: 'uuid',
  })
  @Index()
  ownerUserId!: string;

  /** When set, the document applies to this enrolled child (student profile), not a student user. */
  @Column({ name: 'student_profile_id', type: 'uuid', nullable: true })
  @Index()
  studentProfileId!: string | null;

  @Column({
    name: 'document_type_id',
    type: 'uuid',
  })
  @Index()
  documentTypeId!: string;

  @Column({ name: 'file_name',
      type: 'varchar'
})
  fileName!: string;

  @Column({ name: 's3_key',
      type: 'varchar'
})
  s3Key!: string;

  @Column({ name: 'mime_type', nullable: true , type: 'varchar' })
  mimeType!: string | null;

  @Column({ name: 'size_bytes', type: 'bigint', nullable: true })
  sizeBytes!: number | null;

  @Column({ name: 'issued_at', type: 'timestamp', nullable: true })
  issuedAt!: Date | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt!: Date | null;

  @Column({
    name: 'uploaded_by_user_id',
    type: 'uuid'
  })
  @Index()
  uploadedByUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser!: User;

  @ManyToOne(() => StudentProfile, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'student_profile_id' })
  studentProfile!: StudentProfile | null;

  @ManyToOne(() => DocumentType, (type) => type.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_type_id' })
  documentType!: DocumentType;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_user_id' })
  uploadedBy!: User;
}

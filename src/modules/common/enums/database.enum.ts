export enum UserRole {
  ADMIN = 'ADMIN',
  DIRECTOR = 'DIRECTOR',
  BRANCH_DIRECTOR = 'BRANCH_DIRECTOR',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export enum StaffPosition {
  ED_DIRECTOR = 'ED_DIRECTOR',
  LEAD_TEACHER = 'LEAD_TEACHER',
  ASSISTANT_TEACHER = 'ASSISTANT_TEACHER',
  PARAPROFESSIONAL = 'PARAPROFESSIONAL',
}

export enum RenewalPeriod {
  NONE = 'NONE',
  ANNUAL = 'ANNUAL',
  BIENNIAL = 'BIENNIAL',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

/** Inspection program grouping (matches Postgres `inspection_category` where used). */
export enum InspectionCategory {
  DOH = 'doh',
  FACILITY_SAFETY = 'facility_safety',
}

/**
 * Shared PostgreSQL enum type names for TypeORM + synchronize.
 * Every column using the same TS enum must reuse the same `enumName`, or
 * Postgres will create duplicate types and sync may try to DROP TYPE while
 * other tables still depend on it.
 */
export const PgEnumName = {
  UserRole: 'user_role_enum',
  StaffPosition: 'staff_position_enum',
  RenewalPeriod: 'renewal_period_enum',
  InvitationStatus: 'invitation_status_enum',
  EmploymentStatus: 'employment_status_enum',
  InspectionCategory: 'inspection_category',
} as const;

import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';
import { User } from '../../entities/user.entity';
import { School } from '../../entities/school.entity';
import { Branch } from '../../entities/branch.entity';
import { ComplianceCategory } from '../../entities/compliance-category.entity';
import { Document, DocumentType } from '../../entities/document.entity';
import { TeacherPosition } from '../../entities/teacher-position.entity';
import { TeacherProfile } from '../../entities/teacher-profile.entity';
import { StudentProfile } from '../../entities/student-profile.entity';
import { ParentProfile } from '../../entities/parent-profile.entity';
import { StudentParent } from '../../entities/student-parent.entity';
import { InspectionType } from '../../entities/inspection-type.entity';
import { ComplianceRequirement } from '../../entities/compliance-requirement.entity';
import { CertificationType } from '../../entities/certification-type.entity';
import { CertificationRecord } from '../../entities/certification-record.entity';
import { Invitation } from '../../entities/invitation.entity';
import {
  EmploymentStatus,
  InvitationStatus,
  RenewalPeriod,
  UserRole,
} from './enums/database.enum';

export type DemoSeedLogger = Pick<Console, 'log' | 'warn'>;

export type DemoSeedRepositories = {
  users: Repository<User>;
  schools: Repository<School>;
  branches: Repository<Branch>;
  complianceCategories: Repository<ComplianceCategory>;
  documentTypes: Repository<DocumentType>;
  documents: Repository<Document>;
  teacherPositions: Repository<TeacherPosition>;
  teacherProfiles: Repository<TeacherProfile>;
  studentProfiles: Repository<StudentProfile>;
  parentProfiles: Repository<ParentProfile>;
  studentParents: Repository<StudentParent>;
  inspectionTypes: Repository<InspectionType>;
  complianceRequirements: Repository<ComplianceRequirement>;
  certificationTypes: Repository<CertificationType>;
  certificationRecords: Repository<CertificationRecord>;
  invitations: Repository<Invitation>;
};

export function buildDemoSeedRepositories(
  ds: DataSource,
): DemoSeedRepositories {
  return {
    users: ds.getRepository(User),
    schools: ds.getRepository(School),
    branches: ds.getRepository(Branch),
    complianceCategories: ds.getRepository(ComplianceCategory),
    documentTypes: ds.getRepository(DocumentType),
    documents: ds.getRepository(Document),
    teacherPositions: ds.getRepository(TeacherPosition),
    teacherProfiles: ds.getRepository(TeacherProfile),
    studentProfiles: ds.getRepository(StudentProfile),
    parentProfiles: ds.getRepository(ParentProfile),
    studentParents: ds.getRepository(StudentParent),
    inspectionTypes: ds.getRepository(InspectionType),
    complianceRequirements: ds.getRepository(ComplianceRequirement),
    certificationTypes: ds.getRepository(CertificationType),
    certificationRecords: ds.getRepository(CertificationRecord),
    invitations: ds.getRepository(Invitation),
  };
}

const hash = (plain: string) => bcrypt.hash(plain, 12);

/**
 * Full demo dataset when the database has no schools yet.
 * Set SEED_SAMPLE_DATA=false to skip entirely.
 */
export async function seedDemoData(
  r: DemoSeedRepositories,
  logger: DemoSeedLogger = console,
): Promise<void> {
  if (process.env.SEED_SAMPLE_DATA === 'false') {
    logger.log('[demo-seed] SEED_SAMPLE_DATA=false — skipping sample data.');
    return;
  }

  if ((await r.schools.count()) > 0) {
    logger.log('[demo-seed] Schools already present — skipping sample data.');
    return;
  }

  const schoolName =
    process.env.DEMO_SCHOOL_NAME?.trim() || 'Sunshine Preschool';
  const directorEmail = (
    process.env.DEMO_DIRECTOR_EMAIL || 'director@demo.school'
  ).toLowerCase();
  const teacherEmail = (
    process.env.DEMO_TEACHER_EMAIL || 'teacher@demo.school'
  ).toLowerCase();
  const branchDirectorEmail = (
    process.env.DEMO_BRANCH_DIRECTOR_EMAIL || 'branchdirector@demo.school'
  ).toLowerCase();
  const parentEmail = (
    process.env.DEMO_PARENT_EMAIL || 'parent@demo.school'
  ).toLowerCase();
  /** Same password for every seeded demo user (override with DEMO_PASSWORD). */
  const demoPassword =
    process.env.DEMO_PASSWORD?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    'Admin@123';
  const hashedDemoPassword = await hash(demoPassword);

  const school = r.schools.create({
    name: schoolName,
    email: 'office@demo.school',
    phone: '(555) 100-2000',
    address: '100 Learning Lane',
    city: 'Springfield',
    state: 'NY',
    zipCode: '10001',
    website: 'https://demo.school',
    licenseNumber: 'NY-DOH-12345',
    certificationNumber: 'CERT-2025-001',
    minAge: 2,
    maxAge: 6,
    totalCapacity: 120,
    primaryColor: '#2563eb',
    logoUrl: null,
    isApproved: true,
    approvedAt: new Date(),
    approvedBy: 'seed',
    deletedBy: null,
  });
  await r.schools.save(school);

  const branch = r.branches.create({
    name: 'Main Campus',
    schoolId: school.id,
    address: school.address,
    city: school.city,
    state: school.state,
    zipCode: school.zipCode,
    phone: school.phone,
    email: 'main@demo.school',
    minAge: school.minAge,
    maxAge: school.maxAge,
    totalCapacity: 80,
    isPrimary: true,
    isActive: true,
    notes: 'Primary location',
  });
  await r.branches.save(branch);

  const director = r.users.create({
    email: directorEmail,
    password: hashedDemoPassword,
    name: 'Alex Director',
    phone: null,
    role: UserRole.DIRECTOR,
    authorities: [UserRole.DIRECTOR],
    schoolId: school.id,
    branchId: null,
    assignedById: null,
    staffPosition: null,
    staffClearanceActive: false,
    emailVerifiedAt: new Date(),
    deletedBy: null,
  });
  await r.users.save(director);

  const branchDirector = r.users.create({
    email: branchDirectorEmail,
    password: hashedDemoPassword,
    name: 'Blake Branch Director',
    phone: null,
    role: UserRole.BRANCH_DIRECTOR,
    authorities: [UserRole.BRANCH_DIRECTOR],
    schoolId: school.id,
    branchId: branch.id,
    assignedById: director.id,
    staffPosition: null,
    staffClearanceActive: true,
    emailVerifiedAt: new Date(),
    deletedBy: null,
  });
  await r.users.save(branchDirector);

  const teacher = r.users.create({
    email: teacherEmail,
    password: hashedDemoPassword,
    name: 'Taylor Teacher',
    phone: null,
    role: UserRole.TEACHER,
    authorities: [UserRole.TEACHER],
    schoolId: school.id,
    branchId: branch.id,
    assignedById: director.id,
    staffPosition: null,
    staffClearanceActive: true,
    emailVerifiedAt: new Date(),
    deletedBy: null,
  });
  await r.users.save(teacher);

  const parent = r.users.create({
    email: parentEmail,
    password: hashedDemoPassword,
    name: 'Pat Parent',
    phone: '(555) 300-4000',
    role: UserRole.PARENT,
    authorities: [UserRole.PARENT],
    schoolId: school.id,
    branchId: null,
    assignedById: null,
    staffPosition: null,
    staffClearanceActive: false,
    emailVerifiedAt: new Date(),
    deletedBy: null,
  });
  await r.users.save(parent);

  await r.parentProfiles.save(
    r.parentProfiles.create({
      phone: parent.phone,
      address: '200 Family Rd, Springfield, NY',
      notes: 'Demo parent profile',
      user: parent,
    }),
  );

  const profileSam = r.studentProfiles.create({
    schoolId: school.id,
    branchId: branch.id,
    firstName: 'Sam',
    lastName: 'Student',
    dateOfBirth: new Date('2019-05-10'),
    gradeLevel: 'Pre-K',
    rollNumber: 'PK-001',
    guardianName: 'Pat Parent',
    guardianPhone: '(555) 300-4000',
    deletedBy: null,
  });
  await r.studentProfiles.save(profileSam);

  const profileRiley = r.studentProfiles.create({
    schoolId: school.id,
    branchId: branch.id,
    firstName: 'Riley',
    lastName: 'Student',
    dateOfBirth: new Date('2018-11-02'),
    gradeLevel: 'Kindergarten',
    rollNumber: 'K-042',
    guardianName: 'Pat Parent',
    guardianPhone: '(555) 300-4000',
    deletedBy: null,
  });
  await r.studentProfiles.save(profileRiley);

  await r.studentParents.save(
    r.studentParents.create({
      relation: 'Parent',
      isPrimary: true,
      studentProfileId: profileSam.id,
      parentId: parent.id,
    }),
  );

  await r.studentParents.save(
    r.studentParents.create({
      relation: 'Parent',
      isPrimary: true,
      studentProfileId: profileRiley.id,
      parentId: parent.id,
    }),
  );

  const posLead = r.teacherPositions.create({
    schoolId: school.id,
    name: 'Lead Teacher',
    description: 'Room lead; ECE credits required.',
    minEducationLevel: 'Associate',
    minCredits: 24,
    minEceCredits: 12,
    minYearsExperience: 1,
    requiresCda: false,
    requiresStateCert: true,
    isActive: true,
  });
  await r.teacherPositions.save(posLead);

  const posAssistant = r.teacherPositions.create({
    schoolId: school.id,
    name: 'Assistant Teacher',
    description: 'Supports lead teacher.',
    minEducationLevel: 'High School',
    minCredits: null,
    minEceCredits: 6,
    minYearsExperience: 0,
    requiresCda: false,
    requiresStateCert: false,
    isActive: true,
  });
  await r.teacherPositions.save(posAssistant);

  await r.teacherProfiles.save(
    r.teacherProfiles.create({
      userId: teacher.id,
      subjectArea: 'Early Childhood',
      employeeCode: 'T-1001',
      joiningDate: new Date('2022-08-15'),
      phone: '(555) 200-3000',
      hireDate: new Date('2022-08-15'),
      employmentStatus: EmploymentStatus.ACTIVE,
      certificationType: 'CDA',
      certificationExpiry: new Date('2026-12-31'),
      backgroundCheckDate: new Date('2024-01-10'),
      backgroundCheckExpiry: new Date('2027-01-10'),
      positionId: posLead.id,
      notes: 'Demo teacher profile',
    }),
  );

  const catHealth = r.complianceCategories.create({
    name: 'Health & Medical',
    slug: 'health-medical',
    description: 'Immunizations, health forms, allergies',
    icon: 'heart',
    sortOrder: 0,
    schoolId: school.id,
    createdById: director.id,
  });
  await r.complianceCategories.save(catHealth);

  const catOps = r.complianceCategories.create({
    name: 'Operations',
    slug: 'operations',
    description: 'Handbooks, emergency contacts',
    icon: 'clipboard',
    sortOrder: 1,
    schoolId: school.id,
    createdById: director.id,
  });
  await r.complianceCategories.save(catOps);

  const dtTeacherCpr = r.documentTypes.create({
    name: 'CPR / First Aid',
    targetRole: UserRole.TEACHER,
    isMandatory: true,
    renewalPeriod: RenewalPeriod.BIENNIAL,
    sortOrder: 0,
    schoolId: school.id,
    branchId: null,
    createdById: director.id,
    categoryId: catHealth.id,
  });
  await r.documentTypes.save(dtTeacherCpr);

  const dtTeacherBg = r.documentTypes.create({
    name: 'Background Check',
    targetRole: UserRole.TEACHER,
    isMandatory: true,
    renewalPeriod: RenewalPeriod.ANNUAL,
    sortOrder: 1,
    schoolId: school.id,
    branchId: null,
    createdById: director.id,
    categoryId: catHealth.id,
  });
  await r.documentTypes.save(dtTeacherBg);

  const dtStudentHealth = r.documentTypes.create({
    name: 'Universal Health Record',
    targetRole: UserRole.STUDENT,
    isMandatory: true,
    renewalPeriod: RenewalPeriod.ANNUAL,
    sortOrder: 0,
    schoolId: school.id,
    branchId: null,
    createdById: director.id,
    categoryId: catHealth.id,
  });
  await r.documentTypes.save(dtStudentHealth);

  const dtParentHandbook = r.documentTypes.create({
    name: 'Parent Handbook Acknowledgment',
    targetRole: UserRole.PARENT,
    isMandatory: true,
    renewalPeriod: RenewalPeriod.NONE,
    sortOrder: 0,
    schoolId: school.id,
    branchId: null,
    createdById: director.id,
    categoryId: catOps.id,
  });
  await r.documentTypes.save(dtParentHandbook);

  const now = new Date();
  const in90 = new Date(now);
  in90.setDate(in90.getDate() + 90);

  await r.documents.save(
    r.documents.create({
      ownerUserId: teacher.id,
      studentProfileId: null,
      documentTypeId: dtTeacherCpr.id,
      fileName: 'cpr-certificate-demo.pdf',
      s3Key: `demo/${school.id}/cpr-placeholder.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 102400,
      issuedAt: new Date(now.getFullYear(), 0, 1),
      expiresAt: in90,
      verifiedAt: now,
      uploadedByUserId: teacher.id,
    }),
  );

  /** Child enrollment docs: acting owner is the parent user; subject is the student profile. */
  await r.documents.save(
    r.documents.create({
      ownerUserId: parent.id,
      studentProfileId: profileSam.id,
      documentTypeId: dtStudentHealth.id,
      fileName: 'sam-universal-health-record.pdf',
      s3Key: `demo/${school.id}/branches/${branch.id}/student-doc/${profileSam.id}/health-sam.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 62400,
      issuedAt: new Date(now.getFullYear(), 2, 1),
      expiresAt: in90,
      verifiedAt: now,
      uploadedByUserId: parent.id,
    }),
  );

  await r.documents.save(
    r.documents.create({
      ownerUserId: parent.id,
      studentProfileId: profileRiley.id,
      documentTypeId: dtStudentHealth.id,
      fileName: 'riley-universal-health-record.pdf',
      s3Key: `demo/${school.id}/branches/${branch.id}/student-doc/${profileRiley.id}/health-riley.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 58800,
      issuedAt: new Date(now.getFullYear(), 4, 1),
      expiresAt: in90,
      verifiedAt: null,
      uploadedByUserId: parent.id,
    }),
  );

  await r.documents.save(
    r.documents.create({
      ownerUserId: parent.id,
      studentProfileId: null,
      documentTypeId: dtParentHandbook.id,
      fileName: 'parent-handbook-acknowledgment.pdf',
      s3Key: `demo/${school.id}/parent-handbook-signed.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 20480,
      issuedAt: new Date(now.getFullYear(), 0, 15),
      expiresAt: null,
      verifiedAt: now,
      uploadedByUserId: parent.id,
    }),
  );

  const inspDoh = r.inspectionTypes.create({
    schoolId: school.id,
    name: 'DOH Licensing Visit',
    description: 'Department of Health inspection checklist',
    frequency: 'Annual',
  });
  await r.inspectionTypes.save(inspDoh);

  const inspFacility = r.inspectionTypes.create({
    schoolId: school.id,
    name: 'Fire & Life Safety',
    description: 'Fire drill logs, extinguishers, egress',
    frequency: 'Quarterly',
  });
  await r.inspectionTypes.save(inspFacility);

  await r.complianceRequirements.save(
    r.complianceRequirements.create({
      schoolId: school.id,
      name: 'Fire drill log (current month)',
      description: 'Signed log for monthly fire drill',
      inspectionTypeId: inspFacility.id,
      ownerId: branchDirector.id,
      createdById: director.id,
    }),
  );

  await r.complianceRequirements.save(
    r.complianceRequirements.create({
      schoolId: school.id,
      name: 'Medication administration policy',
      description: 'Annual policy review',
      inspectionTypeId: inspDoh.id,
      ownerId: director.id,
      createdById: director.id,
    }),
  );

  await r.complianceRequirements.save(
    r.complianceRequirements.create({
      schoolId: school.id,
      name: 'Staff health screening roster',
      description: 'Quarterly roster update',
      inspectionTypeId: inspDoh.id,
      ownerId: null,
      createdById: director.id,
    }),
  );

  const certType = r.certificationTypes.create({
    schoolId: school.id,
    name: 'Facility Fire Safety Certificate',
    description: 'Building-wide fire inspection certificate',
    defaultValidityMonths: 12,
  });
  await r.certificationTypes.save(certType);

  await r.certificationRecords.save(
    r.certificationRecords.create({
      schoolId: school.id,
      certificationTypeId: certType.id,
      issueDate: new Date(now.getFullYear() - 1, 5, 1),
      expiryDate: new Date(now.getFullYear() + 1, 5, 1),
      referenceNumber: 'FIRE-2025-DEMO',
      documentUrl: null,
    }),
  );

  const token = crypto.randomBytes(24).toString('hex');
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 14);

  await r.invitations.save(
    r.invitations.create({
      email: 'newparent@example.com',
      role: UserRole.PARENT,
      token,
      status: InvitationStatus.PENDING,
      expiresAt: expires,
      acceptedAt: null,
      schoolId: school.id,
      branchId: branch.id,
      sentById: director.id,
    }),
  );

  logger.log(
    `[demo-seed] Full sample: "${schoolName}", branch, director, branch director, teacher, ` +
      `2 enrolled children (student profiles, no student logins), parent + StudentParent links, ` +
      `positions, teacher/parent profiles, categories, document types, ` +
      `1 verified teacher doc, 2 child health docs (1 verified, 1 pending review), 1 signed parent handbook, ` +
      `inspection types, compliance reqs, certification, invitation. ` +
      `Demo accounts share one password (DEMO_PASSWORD, else ADMIN_PASSWORD, else Admin@123).`,
  );
}

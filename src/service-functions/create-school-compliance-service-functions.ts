import type { INestApplication } from '@nestjs/common';
import { AnalyticsService } from '../modules/analytics/analytics.service';
import { AuthService } from '../modules/auth/auth.service';
import { SeederService } from '../modules/common/seeder.service';
import { BranchDashboardService } from '../modules/branch/branch-dashboard.service';
import { BranchService } from '../modules/branch/branch.service';
import { CertificationRecordService } from '../modules/school/certification-record.service';
import { ComplianceCategoryService } from '../modules/compliance-category/compliance-category.service';
import { ComplianceRequirementService } from '../modules/school/compliance-requirement.service';
import { DocumentTypeService } from '../modules/document-type/document-type.service';
import { DocumentService } from '../modules/document/document.service';
import { InspectionTypeService } from '../modules/school/inspection-type.service';
import { InvitationService } from '../modules/invitation/invitation.service';
import { MailerService } from '../modules/mailer/mailer.service';
import { SchoolService } from '../modules/school/school.service';
import { SettingsService } from '../modules/settings/settings.service';
import { StorageService } from '../modules/storage/storage.service';
import { StudentParentService } from '../modules/student-parent/student-parent.service';
import { UserService } from '../modules/user/user.service';
import {
  createAuditEventsServiceFunctions,
  type AuditEventsServiceFunctions,
} from './audit-events.functions';
import { createServiceFunctions } from './wrap-service';

export type SchoolComplianceServiceFunctions = {
  mailer: ReturnType<typeof createServiceFunctions<MailerService>>;
  storage: ReturnType<typeof createServiceFunctions<StorageService>>;
  auth: ReturnType<typeof createServiceFunctions<AuthService>>;
  user: ReturnType<typeof createServiceFunctions<UserService>>;
  school: {
    school: ReturnType<typeof createServiceFunctions<SchoolService>>;
    inspectionTypes: ReturnType<
      typeof createServiceFunctions<InspectionTypeService>
    >;
    complianceRequirements: ReturnType<
      typeof createServiceFunctions<ComplianceRequirementService>
    >;
    certificationRecords: ReturnType<
      typeof createServiceFunctions<CertificationRecordService>
    >;
  };
  branch: {
    branch: ReturnType<typeof createServiceFunctions<BranchService>>;
    dashboard: ReturnType<
      typeof createServiceFunctions<BranchDashboardService>
    >;
  };
  documentType: ReturnType<typeof createServiceFunctions<DocumentTypeService>>;
  document: ReturnType<typeof createServiceFunctions<DocumentService>>;
  settings: ReturnType<typeof createServiceFunctions<SettingsService>>;
  analytics: ReturnType<typeof createServiceFunctions<AnalyticsService>>;
  complianceCategory: ReturnType<
    typeof createServiceFunctions<ComplianceCategoryService>
  >;
  invitation: ReturnType<typeof createServiceFunctions<InvitationService>>;
  studentParent: ReturnType<
    typeof createServiceFunctions<StudentParentService>
  >;
  auditEvents: AuditEventsServiceFunctions;
  seeder: ReturnType<typeof createServiceFunctions<SeederService>>;
};

/**
 * Resolves one Nest-backed “function bag” per feature area for scripts, workers,
 * or future service splits. Methods are bound to their provider instances.
 */
export function createSchoolComplianceServiceFunctions(
  app: INestApplication,
): SchoolComplianceServiceFunctions {
  return {
    mailer: createServiceFunctions(app.get(MailerService)),
    storage: createServiceFunctions(app.get(StorageService)),
    auth: createServiceFunctions(app.get(AuthService)),
    user: createServiceFunctions(app.get(UserService)),
    school: {
      school: createServiceFunctions(app.get(SchoolService)),
      inspectionTypes: createServiceFunctions(app.get(InspectionTypeService)),
      complianceRequirements: createServiceFunctions(
        app.get(ComplianceRequirementService),
      ),
      certificationRecords: createServiceFunctions(
        app.get(CertificationRecordService),
      ),
    },
    branch: {
      branch: createServiceFunctions(app.get(BranchService)),
      dashboard: createServiceFunctions(app.get(BranchDashboardService)),
    },
    documentType: createServiceFunctions(app.get(DocumentTypeService)),
    document: createServiceFunctions(app.get(DocumentService)),
    settings: createServiceFunctions(app.get(SettingsService)),
    analytics: createServiceFunctions(app.get(AnalyticsService)),
    complianceCategory: createServiceFunctions(
      app.get(ComplianceCategoryService),
    ),
    invitation: createServiceFunctions(app.get(InvitationService)),
    studentParent: createServiceFunctions(app.get(StudentParentService)),
    auditEvents: createAuditEventsServiceFunctions(),
    seeder: createServiceFunctions(app.get(SeederService)),
  };
}

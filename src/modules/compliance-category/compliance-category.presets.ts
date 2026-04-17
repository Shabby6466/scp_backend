/**
 * Default compliance categories per school — aligned with Compliance Center nav
 * (overview, DOH, facility & safety, certifications). Slugs are stable API keys.
 *
 * Domain-specific rows (DocumentType uploads, CertificationType, InspectionType) link here via
 * `compliance_category_id` / `categoryId`. New slugs beyond these four need UI + API handling
 * when you introduce new tables or forms.
 */
export type ComplianceCategoryPreset = {
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  sortOrder: number;
};

export const DEFAULT_COMPLIANCE_CATEGORY_PRESETS: ComplianceCategoryPreset[] = [
  {
    slug: 'compliance-overview',
    name: 'Compliance overview',
    description:
      'General compliance items and cross-cutting requirements for this school.',
    icon: 'layout-grid',
    sortOrder: 0,
  },
  {
    slug: 'doh',
    name: 'DOH & health',
    description:
      'Department of health, immunizations, health forms, and medical documentation.',
    icon: 'activity',
    sortOrder: 10,
  },
  {
    slug: 'facility-safety',
    name: 'Facility & safety',
    description: 'Fire, life safety, building inspections, and facility-related compliance.',
    icon: 'flame',
    sortOrder: 20,
  },
  {
    slug: 'certifications',
    name: 'Certifications & licenses',
    description: 'Staff credentials, licenses, vendor and facility certifications.',
    icon: 'award',
    sortOrder: 30,
  },
];

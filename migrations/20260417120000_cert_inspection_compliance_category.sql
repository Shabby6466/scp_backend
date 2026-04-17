-- Links CertificationType and InspectionType to ComplianceCategory (four preset slugs per school).
-- Run against PostgreSQL when not using TypeORM synchronize.

ALTER TABLE "CertificationType"
  ADD COLUMN IF NOT EXISTS "compliance_category_id" uuid NULL;

ALTER TABLE "InspectionType"
  ADD COLUMN IF NOT EXISTS "compliance_category_id" uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_certification_type_compliance_category'
  ) THEN
    ALTER TABLE "CertificationType"
      ADD CONSTRAINT fk_certification_type_compliance_category
      FOREIGN KEY ("compliance_category_id")
      REFERENCES "ComplianceCategory"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_inspection_type_compliance_category'
  ) THEN
    ALTER TABLE "InspectionType"
      ADD CONSTRAINT fk_inspection_type_compliance_category
      FOREIGN KEY ("compliance_category_id")
      REFERENCES "ComplianceCategory"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_certification_type_compliance_category_id
  ON "CertificationType" ("compliance_category_id");

CREATE INDEX IF NOT EXISTS idx_inspection_type_compliance_category_id
  ON "InspectionType" ("compliance_category_id");

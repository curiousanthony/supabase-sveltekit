ALTER TABLE "formations" ADD COLUMN "company_id" uuid;

ALTER TABLE "formations"
  ADD CONSTRAINT "formations_company_id_fkey"
  FOREIGN KEY ("company_id")
  REFERENCES "companies"("id")
  ON UPDATE CASCADE
  ON DELETE SET NULL;

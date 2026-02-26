# Hotfix 2026-02-26: Contacts pages 500

**Issue:** `/contacts/entreprises`, `/contacts/formateurs`, and contact detail pages returned 500 in production.

**Cause:** Production DB was behind `main`: missing `industries` table and `companies.industry_id`, and `formateurs` still had column `departements` (app expects `departement`).

**Fix (DB only):** Applied to production Supabase:

1. **rename_formateurs_departement** – `formateurs.departements` → `departement`
2. **industries_table** – created `industries` table, added `companies.industry_id`, migrated data from `industry` enum, dropped `industry` column and `company_industry` enum

No code changes; app on `main` already expected this schema.

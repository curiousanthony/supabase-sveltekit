# CRM schema alignment: Notion prototype vs app DB

Comparison of the **Prototype Mentore Manager** CRM entities (Clients/Contacts, Entreprises, Formateurs) with the current Drizzle/Supabase schema and Suivi de projet CRM tickets.

---

## 1. Clients (Contacts) — Notion `Clients (mm)` vs app `contacts`

**Notion data source:** `collection://305a9fc7-55ff-8027-ba9f-000bb3eafbfd`

| Notion property        | App column / relation        | Status |
|------------------------|------------------------------|--------|
| Nom du contact client (title) | `first_name` + `last_name`       | OK — split in app |
| Nom (formula)          | Derived from first + last    | OK |
| Prénom (formula)        | `first_name`                 | OK |
| Poste (select: Responsable RH, CEO) | `poste` (`contact_role`: + Autre) | OK |
| E-mail                 | `email`                      | OK |
| Téléphone              | `phone`                      | OK |
| LinkedIn               | `linkedin_url`               | OK |
| Commentaire interne    | `internal_notes`            | OK |
| Propriétaire           | `owner_id` → users           | OK |
| Entreprise(s) (relation) | `contact_companies` (M:N)   | OK |
| Deals / Deals 1        | `deals.contact_id`           | OK |
| Formations (relation)  | No direct relation           | Gap — derivable via deals only |
| Identifiant (auto)     | `id` (uuid)                  | OK — different convention |

**Conclusion (Contacts):** Aligned with prototype and tickets N1/N4/N5/N6. Only gap: no direct Contact → Formations relation (can be derived from deals).

---

## 2. Entreprises — Notion `Entreprises (mm)` vs app `companies`

**Notion data source:** `collection://305a9fc7-55ff-808b-be4d-000b14ae1dff`

| Notion property           | App column / relation     | Status |
|---------------------------|---------------------------|--------|
| Nom de l'entreprise       | `name`                    | OK |
| N° SIRET                  | `siret`                   | OK |
| Statut juridique          | `legal_status` (enum)     | OK |
| Industrie                 | `industry` (enum + Autre) | OK |
| Nombre de salariés        | `company_size`            | OK |
| Site internet             | `website_url`             | OK |
| Adresse de l'entreprise   | `address`                 | OK |
| Ville (formula)            | `city`                    | OK |
| Région (formula)          | `region`                  | OK |
| Budget estimé             | `estimated_budget`        | OK |
| Dispositifs utilisés      | `funding_devices` (array) | OK |
| OPCO (relation)           | `opco_id` (uuid)          | Partial — no `opcos` table; FK not defined |
| Commentaire en interne    | `internal_notes`          | OK |
| Propriétaire              | `owner_id` → users        | OK |
| Contact (relation)         | `contact_companies`       | OK |
| Deals (relation)          | `deal_companies` + `deals.company_id` | OK |
| Apprenants / Historique   | Rollups in Notion         | OK — to be computed in app |

**Conclusion (Entreprises):** Aligned with prototype and tickets N2/N7/N8/N9. Optional improvement: introduce `opcos` table and reference it from `companies.opco_id` if OPCO is required as first-class entity.

---

## 3. Formateurs — Notion `Formateurs (mm)` vs app `formateurs`

**Notion data source:** `collection://305a9fc7-55ff-80f4-81df-000b5f937e0c`

| Notion property              | App column / relation       | Status |
|-----------------------------|-----------------------------|--------|
| Nom complet (title)         | Via `user_id` → users (first_name, last_name) | OK |
| Email                       | Via users.email             | OK |
| Téléphone                   | —                           | **Missing** — not on users or formateurs |
| Bio / Présentation          | `description`               | OK |
| NDA                         | —                           | **Missing** |
| SIRET                       | —                           | **Missing** |
| Justificatif NDA (file)     | —                           | **Missing** |
| CV (file)                   | —                           | **Missing** |
| Documents conformité (file) | —                           | **Missing** |
| Documents fournis (multi_select) | —                     | **Missing** |
| Conformité Qualiopi         | —                           | **Missing** |
| Date validation profil      | —                           | **Missing** |
| Dernière vérification conformité | —                      | **Missing** |
| Disponible à partir du      | —                           | **Missing** |
| Statut disponibilité        | —                           | **Missing** |
| Statut profil               | —                           | **Missing** |
| Années d'expérience         | —                           | **Missing** |
| Régions (multi_select)      | `departements` (text)       | Partial — type differs |
| Modalité(s)                 | —                           | **Missing** |
| TJM souhaité (€)            | `taux_horaire_min` / `taux_horaire_max` | Partial — min/max vs single TJM |
| Spécialités (relation)      | `formateurs_thematiques` → thematiques | OK |
| Formations (relation)      | —                           | **Missing** — no formateurs ↔ formations |
| Séances (relation)          | —                           | **Missing** — seances use users (instructor), not formateurs |
| Note interne                | `rating`                    | OK |
| Validé par                  | —                           | **Missing** |
| Disponible 7j               | `disponible_7j`             | OK |
| Ville                       | `ville`                     | OK |

**Conclusion (Formateurs):** The app schema is minimal compared to the prototype. Tickets N10 / N10a–c assume “pas de migration majeure”, but the prototype has many fields (NDA, SIRET, Qualiopi, statuts, dates, files, modalités, régions). To use Formateurs “in a similar way” to Notion, the DB and relations need to be extended (see recommendations below).

---

## 4. CRM project tickets (Suivi de projet) — schema-related items

| Ticket   | Scope              | Schema alignment |
|----------|--------------------|------------------|
| TCK-17   | Créer les 3 entités en DB | Contacts + Companies + Deals done; Formateurs table exists but is minimal. |
| N1 (TCK-26) | Schéma Drizzle `contacts` | Done — poste, linkedin_url, owner_id, internal_notes present. |
| N2 (TCK-27) | Schéma Drizzle `companies` + contact_companies + deal_companies | Done. |
| N3       | Aligner schéma Drizzle `deals` | Deals have contact_id, company_id, funding_type, deal_format, intra_inter, modalities, etc. |
| N10 / N10a–c | Formateurs CRM  | Formateurs table and formateurs_thematiques exist; many prototype properties and relations are missing. |

---

## 5. Recommendations

### 5.1 Contacts
- **Optional:** Add a direct Contact → Formations relation (e.g. `contact_formations` or a field on formations) if the product needs “formations du contact” without going through deals. Otherwise, keep deriving from deals.

### 5.2 Companies
- **Optional:** Add `opcos` table and set `companies.opco_id` as FK to `opcos.id` if OPCO becomes a first-class entity.

### 5.3 Formateurs (to match prototype and N10 tickets)
- Add columns to `formateurs` (or separate tables if preferred):
  - `nda` (text), `siret` (text/numeric), `phone` (text; or store on users if shared).
  - `conformite_qualiopi` (enum: À vérifier, Conforme, Non conforme).
  - `statut_disponibilite` (enum: Disponible, En mission, Indisponible).
  - `statut_profil` (enum: En attente, En cours de vérification, Validé, Refusé).
  - `annees_experience` (enum or text: 1, 2-3, 4, 5+).
  - `regions` (text[] or enum[]) to replace or complement `departements`.
  - `modalites` (text[]): Présentiel, Distanciel, Hybride, e-Learning.
  - `tjm_souhaite` (numeric) — optional if keeping min/max.
  - `date_validation_profil`, `derniere_verification_conformite`, `disponible_a_partir_du` (dates).
  - `valide_par` (uuid → users).
- Files (CV, Justificatif NDA, Documents conformité): store in Supabase Storage; keep only keys/URLs (or file IDs) on `formateurs` or a small `formateur_documents` table.
- Relations:
  - Formateurs ↔ Formations: add `formateur_id` (or a join table) on formations or a dedicated table if many-to-many.
  - Séances: add `formateur_id` to `seances` (or keep instructor as user and keep a clear link user ↔ formateur) so “Séances” for a formateur are queryable.

Once these are in place, the app DB will align with the Notion CRM prototype and support the same use cases as the tickets (N10, N10a–c).

---

## 6. Summary

| Entity     | Aligned | Gaps / partial |
|-----------|--------|-----------------|
| **Contacts**  | Yes    | Contact→Formations only via deals. |
| **Entreprises** | Yes   | OPCO: no `opcos` table, `opco_id` is plain uuid. |
| **Formateurs** | Partial | Many fields and relations missing; schema and N10 scope need extension for parity with prototype. |

Document generated from Notion CRM prototype (Clients, Entreprises, Formateurs) and Suivi de projet CRM tickets.

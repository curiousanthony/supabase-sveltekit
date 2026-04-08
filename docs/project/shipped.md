# Shipped

Completed and deployed features and fixes, in reverse chronological order.

---

## 2026-04-08 — Chunk 1 : PDF Templates + Convention Fix + Emails

- **Schéma** — Ajout `prixConvenu` (numeric) sur `formations` et 4 valeurs par défaut workspace (`tvaRate`, `defaultPaymentTerms`, `defaultDevisValidityDays`, `defaultCancellationTerms`). Migration : `20260407100000_chunk1_schema_prix_convenu_workspace_defaults.sql`.
- **Convention corrigée** — Nombre de participants corrigé (requête `formationApprenants` au lieu de `contacts`), tarification branchée (`prixConvenu ?? prixPublic`), fallback `company` quand `client` est null.
- **3 nouveaux PDF** — `feuille_emargement` (preuve post-séance avec horodatage signatures), `devis` (HT/TVA/TTC, conditions, validité), `ordre_mission` (par formateur, TJM, frais). Tous via pdfmake 0.3.7 (CJS `createRequire`).
- **Onglet Documents** — `feuille_emargement` ajouté aux types générables, sélecteur de séance, sélecteur formateur déjà fonctionnel.
- **Emails (P1)** — 3 alias relance (`devis_relance`, `convention_relance`, `ordre_mission_relance`) ajoutés à `EMAIL_TYPE_TO_TEMPLATE` + `ctaUrl` branché dans `sendQuestEmail`.
- **Sécurité** — Vérification d'inscription (`contactId`) pour convocation/certificat ; validation `formationId` pour `seanceId` en émargement.
- **pdfmake** — `generatePdfBuffer` réécrit pour pdfmake 0.3.7 CJS API (`setFonts`/`createPdf`/`getBuffer`). Logos WebP/SVG ignorés gracieusement (PDFKit = PNG/JPEG uniquement).

## 2026 — Formations / Qualiopi (vague séances & suivi)

- **Postmark — émargement** — Envoi des e-mails avec liens de signature pour apprenants et formateurs (`emargement-apprenant`, `emargement-formateur`), y compris envoi groupé par séance ; messages d’erreur explicites (jeton manquant, serveur Sandbox).
- **Postmark — suivi / quêtes** — Action `sendQuestEmail` sur la fiche formation (suivi) : envoi via templates Postmark selon `EMAIL_TYPE_TO_TEMPLATE`, journalisation dans `formation_emails`.
- **Journal e-mails formation** — Table et service centralisés (`email-service.ts`) : statuts `sent` / `logged` / `failed` / `sandbox`, `postmark_message_id` quand applicable.
- **Séances & émargement (vague 2)** — Découpe demi-journée, périodes AM/PM, formateur en émargement, création de séances par lot, UX calendrier (détails dans la décision du 2026-04-02).
- **Documents formation (partiel)** — Génération PDF et stockage pour **convention**, **convocation**, **certificat** ; onglet Documents avec génération côté serveur pour l’ensemble des types déclarés (les autres types renvoient encore une erreur « non implémenté » jusqu’à prochaine livraison).

## Earlier

*Ajouter ici les jalons antérieurs au besoin (CRM, bibliothèque, auth workspace, etc.).*

---

*Dernière mise à jour : 2026-04-08 — reflète l’état du dépôt et des décisions documentées, pas nécessairement un déploiement production daté.*
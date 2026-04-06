# Shipped

Completed and deployed features and fixes, in reverse chronological order.

---

## 2026 — Formations / Qualiopi (vague séances & suivi)

- **Postmark — émargement** — Envoi des e-mails avec liens de signature pour apprenants et formateurs (`emargement-apprenant`, `emargement-formateur`), y compris envoi groupé par séance ; messages d’erreur explicites (jeton manquant, serveur Sandbox).
- **Postmark — suivi / quêtes** — Action `sendQuestEmail` sur la fiche formation (suivi) : envoi via templates Postmark selon `EMAIL_TYPE_TO_TEMPLATE`, journalisation dans `formation_emails`.
- **Journal e-mails formation** — Table et service centralisés (`email-service.ts`) : statuts `sent` / `logged` / `failed` / `sandbox`, `postmark_message_id` quand applicable.
- **Séances & émargement (vague 2)** — Découpe demi-journée, périodes AM/PM, formateur en émargement, création de séances par lot, UX calendrier (détails dans la décision du 2026-04-02).
- **Documents formation (partiel)** — Génération PDF et stockage pour **convention**, **convocation**, **certificat** ; onglet Documents avec génération côté serveur pour l’ensemble des types déclarés (les autres types renvoient encore une erreur « non implémenté » jusqu’à prochaine livraison).

## Earlier

*Ajouter ici les jalons antérieurs au besoin (CRM, bibliothèque, auth workspace, etc.).*

---

*Dernière mise à jour : 2026-04-06 — reflète l’état du dépôt et des décisions documentées, pas nécessairement un déploiement production daté.*

# Statut produit — Formations, e-mails, documents

**Date** : 2026-04-06  
**Rôle** : synthèse type chef de projet (mémoire institutionnelle)

## Ce qui n’est pas prêt (priorité métier)

### Génération de documents (Formation)

Dans `src/lib/services/document-generator.ts`, seuls **convention**, **convocation** et **certificat** sont implémentés. Les types suivants lèvent encore une erreur explicite « pas encore implémentée » :

- `feuille_emargement`
- `attestation`
- `devis`
- `ordre_mission`

L’onglet Documents et l’action serveur associée exposent déjà ces types ; le moteur PDF doit être complété (templates pdfmake, données, upload storage) comme esquissé dans `.cursor/plans/formation_documents_&_ux_dd1d82b4.plan.md`.

**Dette repérée** : pour la convention, le calcul `nbParticipants` utilise une requête incohérente (`contacts.id` comparé à `formationId`) — le nombre de participants sera faux tant que ce n’est pas corrigé.

### Spécifications / plans non bouclés (extraits)

- **Moteur documentaire étendu** : apposition de signatures (`pdf-lib`), déclencheurs auto (quest / lifecycle) décrits dans le plan documents + UX formations.
- **E-mail phase « complète »** : webhooks Postmark (livraison, bounce), mise à jour fine des statuts dans `formation_emails` — pas d’endpoint webhook trouvé dans le dépôt.
- **Spec suivi** (`docs/specs/formations/2026-03-24-suivi-tab-hud-banner-design.md`) : envoi auto du règlement intérieur via Postmark quand les convocations sont complètes — à valider par rapport au code actuel du suivi / quêtes.

## E-mails et Postmark — état réel

**Centralisation** : `src/lib/services/email-service.ts` (`sendFormationTemplateEmail`, et `sendFormationEmail` pour HTML brut).

**Appels effectifs dans l’app** :

1. **Séances / émargement** — `formations/[id]/seances/+page.server.ts` : envoi des liens de signature (templates `emargement-apprenant`, `emargement-formateur`).
2. **Suivi / quête** — `formations/[id]/suivi/+page.server.ts` : action `sendQuestEmail` via `EMAIL_TYPE_TO_TEMPLATE` (nombreux alias Postmark déjà mappés).

**Non couvert par Postmark dans ce dépôt** :

- `sendFormationEmail` : **aucun appel** depuis les routes (chemin HTML brut prêt mais non branché UI).
- **Invitations workspace** : création d’invite + retour du token ; pas d’envoi e-mail applicatif (copie de lien côté UI, pas Postmark).
- **E-mails Supabase Auth** (reset password, confirmation, etc.) : toujours le canal Supabase, pas Postmark.

En résumé : **tous les envois « métier Formation » branchés aujourd’hui passent par Postmark** (templates) ; le reste du produit n’est pas unifié sur Postmark.

## Prochaine étape recommandée

1. **P1** — Finaliser la génération PDF manquante (au minimum feuille d’émargement + attestation, souvent bloquants Qualiopi / parcours Marie).
2. **P1** — Corriger le comptage participants convention.
3. **P2** — Webhooks + statuts de livraison si la traçabilité envoi est un critère de release.
4. **P2** — Aligner spec suivi (règlement intérieur auto) avec l’implémentation ou mettre à jour la spec.

## Suivi des fichiers projet

Les fichiers `docs/project/backlog.md`, `roadmap.md`, `current-sprint.md` et `shipped.md` ont été **mis à jour le 2026-04-06** à partir de cette synthèse ; les maintenir lors des prochaines livraisons.
---
name: suivi-de-projet
description: Manages Agile sprint-based project tracking in Notion for the Mentore Manager project. Use when the user asks about sprint status, current tickets, what to work on next, ticket prioritization, assigning tickets to the current sprint, updating ticket/project/objective status, or overall project progress. Trigger phrases: "tickets en cours", "sprint actuel", "what's next", "qu'est-ce qu'on fait", "assigne au sprint", "marque comme fait", "backlog", "priorités", "que reste-t-il à faire", "état du projet", "projets actifs", "objectifs actifs", "planning sprint".
---

# Suivi de projet — Agile Notion

Gestion Agile à sprints du projet Mentore Manager. L'état du projet vit dans Notion sous la page **Suivi de projet** (elle-même sous "Prototype Mentore Manager"). Toujours répondre en français.

Avant le premier appel MCP de chaque session : lire [reference.md](reference.md) pour charger les IDs canoniques et le vocabulaire des statuts.

---

## Outils Notion MCP

- `notion-search` : recherche sémantique, avec `data_source_url` pour cibler une base ou `page_url` pour chercher dans une hiérarchie.
- `notion-fetch` : lire le contenu ou schéma d'une page/data source par ID ou URL.
- `notion-update-page` : mettre à jour les propriétés (`update_properties`). **Toujours confirmer avec l'utilisateur avant d'écrire.**

---

## Workflow 1 — État courant du sprint

**Déclencheurs** : "sprint actuel", "qu'est-ce qu'on fait", "tickets du sprint", "état du sprint".

1. `notion-search` dans la data source **Sprints** avec `data_source_url: "collection://310a9fc7-55ff-80b4-aae3-000b03e0bfd7"`, query `"Actuel"` → trouver le sprint dont `État du sprint = Actuel`.
2. `notion-fetch` sur la page du sprint → lire `Nom du sprint`, `Dates`, liste de `Tâches` (URLs des tickets).
3. `notion-fetch` sur chaque ticket → `Nom`, `Statut`, `Priorité`, `Projet`.
4. Afficher : nom + dates du sprint, tableau des tickets (ID, Nom, Statut, Priorité, Projet).

---

## Workflow 2 — Priorisation / What's next

**Déclencheurs** : "what's next", "prochaines priorités", "que reste-t-il à faire", "backlog", "sur quoi on travaille".

1. `notion-search` dans **Issues** (`collection://310a9fc7-55ff-808e-9b86-000be9aafb9f`) — query `"prochainement liste d'attente"` → tickets hors sprint actuel.
2. `notion-search` dans **Objectifs** (`collection://310a9fc7-55ff-8037-bfb0-000b168f6e44`) — query `"Actif"` → objectifs en cours.
3. Trier par Priorité : Urgent > Haute > Moyenne > Basse. Croiser avec les Projets `En cours` et Objectifs `Actif`.
4. Présenter les 3–5 prochains tickets recommandés avec une justification courte (priorité + projet + objectif). Ne rien modifier dans Notion.

---

## Workflow 3 — Assigner un ticket au sprint actuel

**Déclencheurs** : "assigne au sprint", "ajoute au sprint", "mets dans le sprint", "planifie le ticket".

1. Identifier le sprint actuel (Workflow 1, étape 1). Récupérer l'URL de la page sprint.
2. **Confirmer avec l'utilisateur** : "Je vais assigner [Nom du ticket] au sprint [Nom du sprint]. Confirmes-tu ?"
3. `notion-update-page` sur la page du ticket, `command: update_properties`, `"Cycle": "<url_du_sprint>"`.
4. Confirmer la mise à jour à l'utilisateur.

---

## Workflow 4 — Mettre à jour un statut

**Déclencheurs** : "marque comme fait", "passe en déployé", "termine le ticket", "ferme le projet", "objectif atteint", "annule le ticket".

1. Identifier la page cible par nom ou ID (ticket → `Statut`, projet → `État`, objectif → `État`).
2. Utiliser la valeur **exacte** du vocabulaire (voir reference.md) : ex. `✅ Fait`, `🚀 Déployé`, `Terminé`, `Atteint`.
3. **Confirmer** : "Je vais mettre [Nom] à [nouvelle valeur]. OK ?"
4. `notion-update-page` — `command: update_properties` — ex. `{ "Statut": "✅ Fait" }`.

---

## Workflow 5 — Vue d'ensemble (bilan)

**Déclencheurs** : "vue d'ensemble", "état du projet", "où on en est", "bilan", "objectifs actifs".

1. `notion-search` dans **Objectifs** — État `Actif`.
2. Pour chaque objectif actif : `notion-fetch` pour lire ses Projets liés.
3. Pour chaque projet actif : `notion-search` dans Issues avec le nom du projet — tickets dont Statut ≠ `✅ Fait` / `🚀 Déployé` / `❌ Annulé`.
4. Présenter la cascade : Objectif → Projets (avec État) → Tickets ouverts (avec Priorité + Statut).

---

---

## Workflow 6 — Créer un ou plusieurs tickets

**Déclencheurs** : "crée un ticket", "ajoute un ticket", "nouveaux tickets", "génère les tickets pour".

### Propriétés obligatoires à toujours remplir

| Propriété | Notes |
|-----------|-------|
| `Nom` | Titre clair et actionnable |
| `Statut` | `📜 Liste d'attente` ou `🔜 Prochainement` par défaut |
| `Type` | `Fonctionnalité`, `Bug`, `Amélioration`, `Infrastructure`, etc. |
| `Priorité` | `Haute` par défaut pour les nouvelles fonctionnalités |
| `Effort estimé` | `XS`/`S`/`M`/`L`/`XL` — estimer honnêtement |
| `Projet` | **Toujours** lier au projet concerné |
| `Assigné à` | Assigner à l'utilisateur par défaut (Anthony = `9ef44abf-97be-482f-82b4-8ab7886ddd78`) |
| `Cycle` | Assigner au sprint pertinent : Sprint actuel si fondation urgente, Sprint suivant si suite logique. Laisser vide si trop lointain. |
| `Bloque` | Lister les tickets que CE ticket débloque (relation → Issues) |
| `Bloqué par` | Lister les tickets dont CE ticket dépend (relation → Issues) |

### Contenu de la page (obligatoire)

Chaque ticket doit avoir un contenu de page détaillé en Notion Markdown avec :
1. **🎯 Objectif** — 1-2 phrases décrivant le but
2. **📋 Prérequis** — tickets/conditions qui doivent être satisfaits avant (avec ✅ ou ⚡)
3. **✅ Checklist** — liste exhaustive des tâches techniques (sous-sections si nécessaire) : routes à créer, requêtes DB, composants, actions serveur, validations, UX, etc.
4. **🔗 Références** — liens vers le prototype Notion, skills à utiliser, collections concernées

### Règles pour les dépendances (Bloque / Bloqué par)

- Schéma DB → bloque toujours les vues et formulaires correspondants
- Vue liste → bloque la page détail (navigation entry point)
- Ticket parent → pas de dépendances directes (les sous-tâches les portent)
- Les relations `Bloque`/`Bloqué par` sont bidirectionnelles : si A bloque B, B est bloqué par A

### Règles pour les sprints

- **Sprint actuel** : uniquement les tickets de fondation (schéma DB, routing de base) déjà en dynamique
- **Sprint suivant** : vues liste et formulaires principaux
- **Pas de sprint** : pages détail, fonctionnalités secondaires, tickets parents

---

## Additional resources

- IDs canoniques, vocabulaire complet, exemples d'appels MCP : [reference.md](reference.md)

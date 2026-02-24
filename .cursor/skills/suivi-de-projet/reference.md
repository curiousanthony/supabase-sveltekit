# Suivi de projet — Référence canonique

## Pages et Data Sources

| Rôle | Type | ID / Data Source URL |
|------|------|----------------------|
| Suivi de projet (page d'accueil) | page | `310a9fc7-55ff-8005-862d-de2793f894cd` |
| Tickets — Issues (mm project) | data source | `collection://310a9fc7-55ff-808e-9b86-000be9aafb9f` |
| Projets (mm suivi) | data source | `collection://310a9fc7-55ff-8034-a8b6-000b2cf1d989` |
| Objectifs (mm suivi) | data source | `collection://310a9fc7-55ff-8037-bfb0-000b168f6e44` |
| Sprints | data source | `collection://310a9fc7-55ff-80b4-aae3-000b03e0bfd7` |

---

## Vocabulaire des statuts (valeurs exactes pour les mises à jour)

### Tickets — propriété `Statut`

| Valeur | Groupe |
|--------|--------|
| `📜 Liste d'attente` | To do |
| `🔜 Prochainement` | To do |
| `⏳ En cours` | In progress |
| `✅ Fait` | Complete |
| `🚀 Déployé` | Complete |
| `❌ Annulé` | Complete |

### Projets — propriété `État`

| Valeur | Groupe |
|--------|--------|
| `Backlog` | To do |
| `Réflexion` | In progress |
| `En pause` | In progress |
| `En cours` | In progress |
| `Maintenance` | In progress |
| `Archivé` | Complete |
| `Terminé` | Complete |

### Objectifs — propriété `État`

| Valeur | Groupe |
|--------|--------|
| `Plus tard` | To do |
| `Actif` | In progress |
| `Atteint` | Complete |

### Sprints — propriété `État du sprint`

| Valeur | Groupe |
|--------|--------|
| `Actuel` | Current |
| `Suivant` | Future |
| `À venir` | Future |
| `Dernier` | Complete |
| `Passés` | Complete |

---

## Propriétés clés par entité

### Ticket (Issues mm project)

| Propriété | Type | Notes |
|-----------|------|-------|
| `Nom` | title | |
| `Statut` | status | valeurs ci-dessus |
| `Priorité` | select | `Urgent`, `Haute`, `Moyenne`, `Basse` |
| `Type` | select | `Fonctionnalité`, `Bug`, `Design`, `Amélioration`, `Infrastructure`, `Sécurité` |
| `Projet` | relation | → Projets (mm suivi) |
| `Cycle` | relation | → Sprints — **assigner à un sprint** |
| `Sous-tâches` | relation | → Issues (enfants) |
| `Tâche parent` | relation | → Issues (parent) |
| `Assigné à` | person | |
| `Échéance` | date | format `date:Échéance:start` |
| `Effort estimé` | select | `XS`, `S`, `M`, `L`, `XL` |
| `userDefined:ID` | auto-id | ex. `TCK-17` |

### Sprint (Sprints)

| Propriété | Type | Notes |
|-----------|------|-------|
| `Nom du sprint` | title | |
| `État du sprint` | status | valeurs ci-dessus |
| `Tâches` | relation | ↔ `Cycle` sur Issues |
| `Dates` | date range | `date:Dates:start` + `date:Dates:end` |
| `Identifiant du sprint` | auto-id | ex. `SPR-1` |

### Projet (Projets mm suivi)

| Propriété | Type | Notes |
|-----------|------|-------|
| `Nom` | title | |
| `État` | status | valeurs ci-dessus |
| `Objectifs` | relation | → Objectifs (mm suivi) |
| `Tickets` | relation | ↔ `Projet` sur Issues |
| `Pôle` | relation | → Équipes |
| `userDefined:ID` | auto-id | ex. `PJT-10` |

### Objectif (Objectifs mm suivi)

| Propriété | Type | Notes |
|-----------|------|-------|
| `Name` | title | |
| `État` | status | valeurs ci-dessus |
| `Projets` | relation | → Projets (mm suivi) |
| `Description` | text | |

---

## Utilisateurs

| Personne | User ID |
|----------|---------|
| Anthony (owner) | `9ef44abf-97be-482f-82b4-8ab7886ddd78` |

---

## Sprints connus

| Sprint | ID | URL | État |
|--------|----|-----|------|
| Sprint 1 | `310a9fc7-55ff-8057-8326-f837bcf4dd6a` | `https://www.notion.so/310a9fc755ff80578326f837bcf4dd6a` | Actuel (→ 1er mars 2026) |
| Sprint 2 | `310a9fc7-55ff-8020-acfa-ee6515d3e9c6` | `https://www.notion.so/310a9fc755ff8020acfaee6515d3e9c6` | Suivant |

---

## Projets connus

| Projet | ID | URL |
|--------|----|-----|
| CRM | `311a9fc7-55ff-80b1-9c99-fc0a19637032` | `https://www.notion.so/311a9fc755ff80b19c99fc0a19637032` |

---

## Tickets CRM (PJT-10)

| ID ticket | Titre court | URL |
|-----------|-------------|-----|
| TCK-15 | Créer la page CRM (/contacts) | `https://www.notion.so/311a9fc755ff8071a9c0d3ec4df1c383` |
| TCK-16 | Sidebar CRM | `https://www.notion.so/311a9fc755ff80fd9e5af5de8de0809e` |
| TCK-17 | Créer les 3 entités en DB | `https://www.notion.so/311a9fc755ff8041bd25e3302b323c69` |
| N1 | Schéma Drizzle `contacts` | `https://www.notion.so/311a9fc755ff8119be88e66a4197f6bf` |
| N2 | Schéma Drizzle `companies` | `https://www.notion.so/311a9fc755ff81faac5afcc5342316ee` |
| N3 | Aligner schéma Drizzle `deals` | `https://www.notion.so/311a9fc755ff81438fcad1eafe9ccbd5` |
| N4 | Vue liste Contacts `/crm/contacts` | `https://www.notion.so/311a9fc755ff81188180dc24a4fc3199` |
| N5 | Formulaire Créer/Éditer Contact | `https://www.notion.so/311a9fc755ff813c8c8bcc2bc17ad274` |
| N6 | Page détail Contact `/crm/contacts/[id]` | `https://www.notion.so/311a9fc755ff817d86cee91caab55fe4` |
| N7 | Vue liste Entreprises `/crm/entreprises` | `https://www.notion.so/311a9fc755ff8160be56ca3e8874561b` |
| N8 | Formulaire Créer/Éditer Entreprise | `https://www.notion.so/311a9fc755ff8165a5cad3795f7464fd` |
| N9 | Page détail Entreprise `/crm/entreprises/[id]` | `https://www.notion.so/311a9fc755ff81319546e85e256e3394` |
| N10 | Gestion Formateurs CRM (parent) | `https://www.notion.so/311a9fc755ff8154a6f4da741eb6ed02` |
| N10a | Vue liste Formateurs `/crm/formateurs` | `https://www.notion.so/311a9fc755ff816f9c68c4d01b0f3f11` |
| N10b | Page détail Formateur `/crm/formateurs/[id]` | `https://www.notion.so/311a9fc755ff8168a45de688ce451f98` |
| N10c | Formulaire Créer/Éditer Formateur | `https://www.notion.so/311a9fc755ff816d87e9cdf0c9d9213a` |

---

## Exemples d'appels MCP

### Trouver le sprint actuel

```json
{
  "query": "Actuel",
  "data_source_url": "collection://310a9fc7-55ff-80b4-aae3-000b03e0bfd7"
}
```

### Lister les tickets en cours

```json
{
  "query": "en cours",
  "data_source_url": "collection://310a9fc7-55ff-808e-9b86-000be9aafb9f"
}
```

### Assigner un ticket au sprint actuel

`notion-update-page` sur la page du ticket :

```json
{
  "page_id": "<uuid-du-ticket>",
  "command": "update_properties",
  "properties": {
    "Cycle": "https://www.notion.so/<uuid-du-sprint-actuel>"
  }
}
```

### Mettre un ticket à "Fait"

```json
{
  "page_id": "<uuid-du-ticket>",
  "command": "update_properties",
  "properties": {
    "Statut": "✅ Fait"
  }
}
```

### Ajouter un récap en commentaire sur un ticket (Workflow 7)

Ne jamais mettre le récap dans le contenu de la page. Utiliser `notion-create-comment` avec un préfixe explicite (« 🤖 Récap de l'agent : » ou « [Agent — récap] ») et une mention @Anthony pour la notification.

Anthony (user id) : `9ef44abf-97be-482f-82b4-8ab7886ddd78`

Exemple d'appel — commentaire page-level avec préfixe + mention + récap :

```json
{
  "page_id": "<uuid-du-ticket>",
  "rich_text": [
    { "type": "text", "text": { "content": "🤖 Récap de l'agent : " } },
    { "type": "mention", "mention": { "type": "user", "user": { "id": "9ef44abf-97be-482f-82b4-8ab7886ddd78" } } },
    { "type": "text", "text": { "content": "\n\n<texte du récap en français>" } }
  ]
}
```

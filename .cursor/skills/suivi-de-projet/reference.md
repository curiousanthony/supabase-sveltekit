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

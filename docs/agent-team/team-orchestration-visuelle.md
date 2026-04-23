# L'Équipe IA en Images

> Un humain. Un chef d'orchestre. Une équipe de spécialistes IA. Ensemble, ils font le travail d'une équipe entière.

---

## 1. L'idée en une image

```mermaid
graph LR
    H["👤 Vous\n(1 humain)"]
    O["🎼 Orchestrateur\n(chef d'équipe IA)"]
    T["✅ Résultat livré"]

    H -->|"une instruction"| O
    O -->|"coordonne l'équipe"| T
```



Un seul message de votre part déclenche l'ensemble du processus. L'orchestrateur distribue le travail, surveille la qualité, et livre.

---

## 2. L'équipe complète

```mermaid
graph TD
    O["🎼 Orchestrateur"]

    O --> UX["🎨 UX Designer\nConçoit l'interface, rédige le plan"]
    O --> PA["📋 Product Analyst\nVérifie que la feature a du sens"]
    O --> AR["🏗️ Architect\nConçoit la base de données et les APIs"]
    O --> TE["🧪 Test Engineer\nÉcrit les tests avant le code"]
    O --> IM["⚙️ Implementer\nCode la feature"]
    O --> RV["🔍 Reviewer\nRelit le code, cherche les bugs"]
    O --> SA["🔒 Security Analyst\nVérifie la sécurité"]
    O --> QA["🖥️ QA Tester\nTeste l'app comme un vrai utilisateur"]
    O --> PM["📁 Project Manager\nMet à jour la doc et les tickets"]
    O --> TA["🧠 Team Architect\nAméliore l'équipe elle-même"]
```



Chaque spécialiste a un rôle précis. L'orchestrateur décide qui travaille, quand, et dans quel ordre.

---

## 3. Le cycle de vie d'une tâche

Chaque tâche (appelée "ticket") suit un chemin balisé de phases. Certaines phases sont en mode **Réflexion** (l'humain peut valider avant d'aller plus loin), d'autres en mode **Exécution** (l'équipe agit de façon autonome).

```mermaid
flowchart LR
    P0["0\nChoix du ticket"]
    P1["1\nDesign Council\n🔵 Réflexion"]
    P1b["1b\nValidation du plan\n🔵 Réflexion"]
    P2["2\nArchitecte\n🔵 Réflexion"]
    P3["3\nTests TDD\n🟢 Exécution"]
    P4["4\nDéveloppement\n🟢 Exécution"]
    P5["5\nRevue de code\n🟢 Exécution"]
    P6["6\nQA — Tests\n🟢 Exécution"]
    P7["7\nDocumentation\n🟢 Exécution"]
    P7b["7b\nFermeture ticket\n🟢 Exécution"]

    P0 --> P1 --> P1b --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P7b
```



> 🔵 **Réflexion** = l'agent propose, vous pouvez intervenir.
> 🟢 **Exécution** = l'équipe avance seule, sans vous interrompre.

---

## 4. Qui fait quoi, et quand

```mermaid
flowchart TD
    P0["Phase 0 — Choix du ticket"]:::exec
    P1A["Phase 1A — Analyse parallèle"]:::reflect
    P1B["Phase 1B — Plan UX"]:::reflect
    P1b["Phase 1b — Validation du plan"]:::reflect
    P2["Phase 2 — Schéma BDD"]:::reflect
    P3["Phase 3 — Tests"]:::exec
    P4["Phase 4 — Code"]:::exec
    P5["Phase 5 — Revue"]:::exec
    P6["Phase 6 — QA"]:::exec
    P7["Phase 7 — Docs"]:::exec
    P7b["Phase 7b — Fermeture"]:::exec

    PA["📋 Product Analyst"]
    AR["🏗️ Architect"]
    UX["🎨 UX Designer"]
    TE["🧪 Test Engineer"]
    IM["⚙️ Implementer"]
    RV["🔍 Reviewer"]
    SA["🔒 Security Analyst"]
    QA["🖥️ QA Tester"]
    PM["📁 Project Manager"]

    P0 --> P1A
    P1A --> PA
    P1A --> AR
    P1A --> P1B
    P1B --> UX
    P1B --> P1b --> P2
    P2 --> AR
    P2 --> P3 --> TE
    P3 --> P4 --> IM
    P4 --> P5
    P5 --> RV
    P5 --> SA
    P5 --> P6 --> QA
    P6 --> P7 --> PM
    P7 --> P7b

    classDef reflect fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
    classDef exec fill:#dcfce7,stroke:#22c55e,color:#14532d
```



**Phase 1A** : Product Analyst + Architect travaillent **en parallèle** (simultanément).
**Phase 5** : Reviewer + Security Analyst travaillent **en parallèle**.
Toutes les autres phases sont **séquentielles** (l'une après l'autre).

---

## 5. La recette change selon le type de tâche

Toutes les tâches ne passent pas par toutes les phases. L'orchestrateur choisit le chemin le plus court qui garantit la qualité.

```mermaid
flowchart TD
    START["Nouvelle tâche"]
    Q1{{"Quel type ?"}}

    START --> Q1

    Q1 -->|"✨ Feature"| F["0 → 1 → 1b → 2 → 3 → 4 → 5 → 6 → 7 → 7b"]
    Q1 -->|"🐛 Bug UI"| BU["0 → 1 → 1b → 3 → 4 → 6 → 7b"]
    Q1 -->|"🐛 Bug backend"| BB["0 → 3 → 4 → 5 → 7b"]
    Q1 -->|"🔧 Dette technique"| TD["0 → 4 → 5 → 7b"]
    Q1 -->|"🔒 Sécurité"| SE["0 → 4 → 5 → 7b"]
    Q1 -->|"📝 Documentation"| DO["0 → 7 → 7b"]

    F:::feature
    BU:::bug
    BB:::bug
    TD:::debt
    SE:::security
    DO:::docs

    classDef feature fill:#ede9fe,stroke:#7c3aed,color:#3b0764
    classDef bug fill:#fee2e2,stroke:#ef4444,color:#7f1d1d
    classDef debt fill:#fef9c3,stroke:#ca8a04,color:#713f12
    classDef security fill:#ffedd5,stroke:#f97316,color:#7c2d12
    classDef docs fill:#f0fdf4,stroke:#16a34a,color:#14532d
```



> Certaines phases peuvent aussi être **sautées automatiquement** si le travail a déjà été fait (plan existant, schéma déjà approuvé, etc.).

---

## 6. Plan mode vs Agent mode

L'orchestrateur sait quand vous impliquer et quand avancer seul.

```mermaid
flowchart LR
    subgraph plan ["🔵 Plan mode — Réflexion"]
        direction TB
        PP1["L'agent propose une approche"]
        PP2["L'agent pose des questions\nsi quelque chose est flou"]
        PP3["Vous lisez, répondez, validez"]
        PP1 --> PP2 --> PP3
    end

    subgraph agent ["🟢 Agent mode — Exécution"]
        direction TB
        AP1["L'agent code, teste, commit"]
        AP2["L'agent corrige les problèmes seul"]
        AP3["L'agent livre et documente"]
        AP1 --> AP2 --> AP3
    end

    plan -->|"vous dites : c'est bon, go !"| agent
```




| Phase                                  | Mode recommandé |
| -------------------------------------- | --------------- |
| Phase 1 — Design Council               | 🔵 Plan mode    |
| Phase 1b — Validation du plan          | 🔵 Plan mode    |
| Phase 2 — Architecture                 | 🔵 Plan mode    |
| Phase 3 à 7b — Build, Review, QA, Docs | 🟢 Agent mode   |


> **Astuce** : pour déclencher des questions de l'agent, ajoutez à votre message : *"pose-moi des questions si tu as besoin d'éclaircissements avant de commencer."*

---

## 7. Le moteur d'auto-amélioration

L'équipe apprend de chaque tâche terminée. Avec le temps, elle devient plus rapide et plus précise.

```mermaid
flowchart LR
    T["✅ Ticket terminé"]
    L["💡 Learning\n(une leçon retenue)"]
    LF["📄 learnings.md\n(mémoire de l'équipe)"]
    TA["🧠 Team Architect\n(tous les 5 tickets)"]
    AD["📝 Définitions agents\nmises à jour"]
    BETTER["🚀 Meilleurs résultats\nà la prochaine session"]

    T --> L --> LF --> TA --> AD --> BETTER
    BETTER -.->|"cycle suivant"| T
```



Le **Team Architect** est lui-même un agent IA. Il lit les leçons accumulées et améliore les définitions des autres agents — sans intervention humaine.

---

## 8. Git et livraison automatiques

L'équipe gère aussi le versioning du code, de façon autonome.

```mermaid
flowchart LR
    P4["⚙️ Phase 4\nCode terminé"]
    C1["📦 Commit\nfeat: T-{id}"]
    P5["🔍 Phase 5\nRevue terminée"]
    C2["📦 Commit\nfix: review findings"]
    P6["🖥️ Phase 6\nQA passé"]
    C3["📦 Commit\nfix: QA findings"]
    P7b["📁 Phase 7b\nTicket fermé"]
    PUSH["⬆️ Push\nvers la branche"]
    PR["🔀 Pull Request\naprès 3+ tickets"]

    P4 --> C1 --> P5 --> C2 --> P6 --> C3 --> P7b --> PUSH
    PUSH -.->|"après 3+ tickets"| PR
```



Aucune action manuelle requise. L'orchestrateur commit, push, et crée les Pull Requests selon des règles prédéfinies.
---
name: feature-documentation
description: Generate standardized, user-friendly feature documentation in French for Mentore Manager. Creates marketing-focused documentation for Learning Center directors, salespeople, and administrative staff. Use when the user asks to document features, create feature guides, or generate user-facing documentation.
---

# Feature Documentation Skill

This skill helps you create consistent, high-quality feature documentation for Mentore Manager that is optimized for non-technical Learning Center staff (directors, salespeople, and administrative secretaries).

## When to Use This Skill

Use this skill when the user:

- Asks to "document [feature-name]" or "create documentation for [feature]"
- Says "generate feature docs" or "write user guides"
- Wants to create marketing documentation for features
- Needs to explain features to Learning Center staff
- Requests Qualiopi compliance documentation

**Example invocations:**
- "Document the Bibliothèque feature"
- "Create user docs for CRM"
- "Generate feature guides for Formations"

## Target Audience

**Primary users:**
- **Directeurs** (Directors) - Learning Center managers who need to understand business value and ROI
- **Commerciaux** (Salespeople) - Staff who sell training programs and need to understand capabilities
- **Secrétaires administratives** (Administrative Secretaries) - Staff who use the system daily for operations

**Key characteristics:**
- Non-technical (not developers)
- Busy (need quick, clear information)
- Focused on Qualiopi compliance
- Need practical, actionable guidance
- Appreciate simple, friendly language

## Documentation Template

All feature documentation must follow this standardized French template. Use **3rd-grade reading level** (CE2) - simple sentences, common words, clear structure.

### Template Structure

```markdown
# [Nom de la Fonctionnalité]

> **Pour qui ?** [Directeur / Commercial / Secrétaire / Tous]
> 
> **En bref :** [One-sentence value proposition]
> 
> **Indicateurs Qualiopi :** [Liste des indicateurs, ex: Indicateur 6, 22, 32]

---

## 🎯 Pourquoi cette fonctionnalité ?

[Problem statement - what pain does this solve?]

**Le problème avec les autres outils :**
- [Pain point 1 with competitors]
- [Pain point 2 with competitors]
- [Pain point 3 with competitors]

**La solution Mentore Manager :**
[How Mentore Manager makes this simple, fast, and enjoyable]

**Bénéfices clés :**
- ✅ [Benefit 1 - time saved, error reduction, etc.]
- ✅ [Benefit 2 - automation, simplicity]
- ✅ [Benefit 3 - compliance, audit-ready]

---

## 📋 Fonctionnalités principales

### [Sous-fonctionnalité 1]

**C'est quoi ?**
[Clear, simple definition in 1-2 sentences]

**Pourquoi vous en avez besoin ?**
[Business value, practical benefit]

**Comment l'utiliser ?**
1. [Step 1 - simple action]
2. [Step 2 - simple action]
3. [Step 3 - simple action]

**Astuces :**
- 💡 [Power user tip 1]
- 💡 [Power user tip 2]

---

### [Sous-fonctionnalité 2]

[Repeat structure for each subfeature]

---

## 👤 Cas d'usage

### Scénario 1 : [Realistic scenario name]

**Situation :**
[Starting point - what the user wants to accomplish]

**Étapes :**
1. [Action 1]
2. [Action 2]
3. [Action 3]

**Résultat :**
[What the user achieves]

---

### Scénario 2 : [Another realistic scenario]

[Repeat structure]

---

## ✅ Conformité Qualiopi

Cette fonctionnalité vous aide à respecter les indicateurs Qualiopi suivants :

**Indicateur [numéro] : [Nom de l'indicateur]**
- [How this feature addresses the indicator]
- [What documentation is automatically generated]
- [What audit trail is maintained]

[Repeat for each relevant indicator]

**Documentation générée automatiquement :**
- [Document type 1]
- [Document type 2]
- [Document type 3]

---

## 🆚 Mentore Manager vs La concurrence

| Fonctionnalité | Digiforma | Qualiobee | Dendreo | Mentore Manager |
|----------------|-----------|-----------|---------|-----------------|
| [Feature aspect 1] | [X étapes manuelles] | [Complexe, manuel] | [Interface compliquée] | **Simple, 1 clic** |
| [Feature aspect 2] | [Pas disponible] | [Nécessite export/import] | [Limité] | **Automatique** |
| [Feature aspect 3] | [Configuration complexe] | [Support externe requis] | [Formation nécessaire] | **Intuitif, zéro formation** |

**Pourquoi Mentore Manager est différent :**
- ⚡ **Plus rapide** : [Specific time savings, e.g., "30 minutes → 2 minutes"]
- 😊 **Plus fun** : Interface moderne, actions claires, résultats immédiats
- 🎯 **Plus simple** : Pas de jargon, pas de complexité inutile

---

## ❓ Questions fréquentes

**Q: [Common question 1]**
R: [Clear, simple answer]

**Q: [Common question 2]**
R: [Clear, simple answer]

**Q: [Common question 3]**
R: [Clear, simple answer]

---

## 🎓 Pour aller plus loin

- [Link to related feature]
- [Link to tutorial]
- [Link to video demo]

---

*Cette documentation est conçue pour vous aider à tirer le meilleur parti de Mentore Manager. Si vous avez des questions, n'hésitez pas à contacter notre équipe.*
```

---

## Research Strategy

When documenting a feature, follow these steps:

### 1. Identify Feature Components

**Routes to examine:**
- `src/routes/(app)/[feature-name]/+page.svelte` - List/index page
- `src/routes/(app)/[feature-name]/creer/+page.svelte` - Create form
- `src/routes/(app)/[feature-name]/[id]/+page.svelte` - Detail/edit page
- `src/routes/(app)/[feature-name]/*/+page.server.ts` - Server actions

**Look for:**
- Available actions (create, read, update, delete, duplicate, export)
- Form fields and their labels
- Validation rules
- Success/error messages
- Navigation flow

### 2. Understand Data Models

**Schemas to examine:**
- `src/lib/db/schema/[feature]-*.ts` - Database schema
- `src/lib/[feature]/[entity]-schema.ts` - Zod validation schemas

**Look for:**
- Entity names and their purpose
- Field names and types
- Relationships (foreign keys, junction tables)
- Enums and dropdown options
- Required vs optional fields

### 3. Map User Workflows

**Trace these flows:**
1. **List → Create → Success**
   - How users view existing items
   - How they initiate creation
   - What information they provide
   - Where they land after success

2. **List → Detail → Edit → Save**
   - How users access item details
   - What they can edit
   - How changes are saved
   - Confirmation messages

3. **List → Delete → Confirm**
   - How deletion is triggered
   - What warnings are shown
   - What happens to related data

4. **Advanced workflows**
   - Duplicate actions
   - Bulk operations
   - Export/import
   - Linking between entities

### 4. Identify Qualiopi Indicators

**Common indicators by feature:**

- **Bibliothèque** (Modules/Programmes): Indicateur 6 (objectifs pédagogiques), Indicateur 11 (moyens pédagogiques)
- **CRM** (Contacts/Companies): Indicateur 1 (information publique), Indicateur 3 (analyse des besoins)
- **Formations**: Indicateurs 2, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32
- **Notifications**: Indicateur 4 (communication), Indicateur 19 (convocation)
- **Messagerie**: Indicateur 4 (communication)

**What to document:**
- Which indicators are addressed
- What documentation is automatically generated
- What audit trails are maintained
- What reports can be exported

### 5. Compare with Competitors

**Research what competitors require:**
- **Digiforma**: Known for complex multi-step processes, heavy configuration
- **Qualiobee**: Known for manual data entry, limited automation
- **Dendreo**: Known for overwhelming interface, steep learning curve

**Frame comparisons around:**
- Number of steps required
- Time to complete tasks
- Ease of use
- Required training
- Automation level

---

## Writing Guidelines

### Language Requirements

**Reading level: 3rd grade (CE2)**
- Short sentences (10-15 words)
- Common, everyday words
- Active voice ("vous créez" not "est créé")
- Present tense for instructions
- No technical jargon

**Vocabulary to use:**
- ✅ "formation" (training session)
- ✅ "apprenant" (learner/student)
- ✅ "formateur" (trainer/instructor)
- ✅ "organisme de formation" (training organization/Learning Center)
- ✅ "fiche" (record/card)
- ✅ "dossier" (file/folder)
- ✅ "attestation" (certificate)
- ✅ "émargement" (attendance sheet)

**Vocabulary to avoid:**
- ❌ "entity", "record", "object" (use "fiche")
- ❌ "database" (use "système")
- ❌ "validation", "schema" (use "vérification")
- ❌ Any English terms unless universally used (like "email")

### Tone Guidelines

**Be:**
- **Friendly**: Use "vous" form, encouraging language
- **Confident**: Present Mentore Manager as the best solution
- **Practical**: Focus on real-world scenarios
- **Empowering**: Show how easy tasks become
- **Positive**: Emphasize benefits, not limitations

**Avoid:**
- Condescending language ("simply", "just", "obviously")
- Negative framing ("don't worry", "no need to panic")
- Uncertainty ("might", "possibly", "perhaps")
- Over-promising ("instant", "perfect", "never fails")

### Structure Guidelines

**Document organization:**
1. Start with value proposition (why this matters)
2. Explain the problem competitors create
3. Show how Mentore Manager solves it
4. List key benefits
5. Detail each subfeature (what, why, how)
6. Provide concrete scenarios
7. Address Qualiopi compliance
8. Compare with competitors
9. Answer common questions

**Formatting:**
- Use headings for scanability
- Use bullet points for lists
- Use numbered steps for procedures
- Use emoji sparingly for visual breaks (🎯 ✅ ⚡ 😊)
- Use bold for emphasis, not underline or italics
- Use tables for comparisons

---

## Directory Structure

All documentation goes in `docs/features/` with this structure:

```
docs/features/
├── README.md (index of all features)
├── [feature-name]/
│   ├── index.md (overview of feature)
│   ├── [subfeature-1].md
│   ├── [subfeature-2].md
│   └── [subfeature-n].md
```

**File naming:**
- Use lowercase
- Use hyphens for spaces
- Use French names (not English)
- Example: `gestion-des-modules.md` not `module-management.md`

**Cross-references:**
- Link to related features
- Link to Qualiopi indicator explanations
- Link to video tutorials (when available)
- Use relative paths: `[CRM](../crm/index.md)`

---

## Examples of Good Documentation

### Example 1: Clear Value Proposition

✅ **Good:**
> "Créez vos programmes de formation en 2 minutes au lieu de 30. Mentore Manager assemble automatiquement vos modules, calcule la durée totale, et génère tous les documents Qualiopi."

❌ **Bad:**
> "The programme creation feature allows users to aggregate modules into a training program with automatic duration calculation and document generation capabilities."

### Example 2: Simple Instructions

✅ **Good:**
> "Comment créer un module :
> 1. Cliquez sur 'Nouveau module'
> 2. Donnez-lui un nom
> 3. Ajoutez le contenu
> 4. Cliquez sur 'Enregistrer'"

❌ **Bad:**
> "To create a module, navigate to the modules section and initiate the creation workflow by clicking the appropriate button, then fill in the required fields in the form that appears."

### Example 3: Practical Scenario

✅ **Good:**
> "**Scénario : Préparer une formation bureautique**
> 
> Sophie doit organiser une formation Excel pour une entreprise. Elle :
> 1. Ouvre la Bibliothèque
> 2. Sélectionne ses modules Excel (Niveau 1, Niveau 2)
> 3. Crée un nouveau programme 'Pack Excel Complet'
> 4. Ajoute ses modules
> 5. Le système calcule automatiquement 14h de formation
> 
> En 2 minutes, son programme est prêt avec tous les objectifs pédagogiques !"

❌ **Bad:**
> "Users can leverage the library functionality to compose training programs from existing modules."

---

## Common Qualiopi Indicators Reference

Use this reference when documenting features:

**Indicateur 1** : L'information publique sur l'offre de formation
**Indicateur 2** : L'identification des objectifs de la prestation
**Indicateur 3** : L'adaptation aux publics bénéficiaires
**Indicateur 4** : La communication sur les conditions d'accès
**Indicateur 5** : L'accueil et l'accompagnement
**Indicateur 6** : Les moyens pédagogiques et techniques
**Indicateur 7** : La mise à disposition de ressources pédagogiques
**Indicateur 11** : La qualification des formateurs et coordinateurs pédagogiques
**Indicateur 19** : La mobilisation des apprenants
**Indicateur 22** : La conformité réglementaire
**Indicateur 32** : Le recueil des appréciations

---

## Step-by-Step Documentation Process

When the user asks you to document a feature, follow these steps:

### Step 1: Research
1. Read the routes under `src/routes/(app)/[feature-name]/`
2. Read the schemas in `src/lib/db/schema/` and `src/lib/[feature-name]/`
3. Identify subfeatures and their relationships
4. Map out user workflows
5. Note which Qualiopi indicators are addressed

### Step 2: Create Directory Structure
1. Create `docs/features/[feature-name]/` directory
2. Plan which files you'll create (index + subfeatures)

### Step 3: Write Overview (index.md)
1. Write the value proposition
2. Explain the problem and solution
3. List key benefits
4. Provide feature overview
5. Add Qualiopi compliance section
6. Add competitor comparison
7. Add FAQs

### Step 4: Write Subfeature Docs
For each subfeature:
1. Use the template structure
2. Explain what it is
3. Explain why it's needed
4. Provide step-by-step instructions
5. Add practical scenarios
6. Include tips and tricks

### Step 5: Update Index
Add the feature to `docs/features/README.md` with:
- Feature name
- Brief description
- Link to detailed docs
- Documentation status

---

## Tips for Success

1. **Research thoroughly** before writing - understand the feature completely
2. **Use concrete examples** with names like "Sophie", "Marc", "Learning Center ABC"
3. **Focus on outcomes** - what users can accomplish, not technical details
4. **Test readability** - if a 9-year-old can't understand it, simplify it
5. **Show, don't tell** - use scenarios instead of abstract descriptions
6. **Emphasize simplicity** - always compare favorably to competitors
7. **Stay positive** - focus on benefits, not limitations
8. **Be specific** - "30 minutes → 2 minutes" is better than "much faster"

---

## Anti-Patterns to Avoid

❌ **Don't:**
- Use passive voice ("is created by" → use "vous créez")
- Write long paragraphs (max 3-4 lines)
- Use technical terms without explanation
- Assume prior knowledge
- Focus on features instead of benefits
- Write vague comparisons ("better than competitors")
- Use screenshots as a crutch (describe clearly first)
- Create documentation that developers would write

✅ **Do:**
- Use active voice and direct address
- Break content into scannable chunks
- Use everyday language
- Explain from first principles
- Focus on time saved, errors prevented, stress reduced
- Name competitors and specific pain points
- Write clear descriptions (screenshots enhance, not replace)
- Write documentation that users want to read

---

*This skill helps create documentation that Learning Center staff actually use and appreciate. Focus on making their lives easier, simpler, and more enjoyable.*

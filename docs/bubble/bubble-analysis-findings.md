# Bubble Application - Analysis Findings

## Date: 2026-01-28

This document contains the actual findings from analyzing the Bubble.io application.

## 1. Besoins OF List View

### Page Structure

**URL**: `https://app.mentore.fr/version-test/admin?tab=besoins%20OF`

**Header Section**:

- Title: "Besoins OF"
- Client/Workspace selector: Combobox with options (SAS Tech Bros, TEST, SARL, Cool Company, etc.)
- "Filtres" (Filters) button
- "Créer un besoin" (Create a need) button

**Tab Navigation**:

- "Profils à proposer" (Profiles to propose)
- "En attente d'acceptation" (Pending acceptance)
- "Profils acceptés" (Accepted profiles)
- "Besoins archivés" (Archived needs)
- "Offres en public" (Public offers) button

### Card Display

Each Besoin OF is displayed as a card with:

**Status & Actions**:

- Status badge: "En cours" (In progress)
- Action button: "Proposer des profils" (Propose profiles)
- Visibility: "Masquée" (Hidden) or view count ("1 vue", "5 vues", "4 vues")

**Main Information**:

- **Title**: Formation name
- **Client**: Company name
- **Duration**: Hours (e.g., "2h", "123h", "12h", "20h", "4h")
- **Type Indicator**:
  - 🪄 "Programme demandé" (Program requested)
  - 🎯 "Besoin précis" (Precise need)

**Details**:

- **Date**: Start date (e.g., "24/02/2025")
- **Type**: "Collectif" (Group) or "Individuel" (Individual)
- **Modality**: "Distanciel", "Hybride Lyon (Auvergne-Rhône-Alpes)", etc.
- **Financement**: Various options including "Financement Interne Paiement via Mentore", "Financement Public Paiement via Mentore"

**Action Button**:

- "Consulter" (Consult) - Opens detail view

## 2. Besoin OF Detail View

### Tabs

**Two main tabs**:

1. **"Informations"** - Display of all formation information
2. **"Admin"** - Administrative workflow management

### Informations Tab

**Header Actions**:

- "Modifier le type de client" (Modify client type) button
- "Archiver le besoin" (Archive the need) button

**Formation Information Displayed**:

1. **Matière enseignée** (Subject taught): e.g., "maths"
2. **Compétences secondaires** (Secondary skills): Multi-select with options like "Analytics Web"
3. **Nombre de personnes à former** (Number of people to train): e.g., "2"
4. **Format de la formation** (Formation format): e.g., "Distanciel"
5. **Date de début souhaitée** (Desired start date): e.g., "24/02/2025"
6. **Modalités de la formation** (Formation modalities): e.g., "Collectif"
7. **Volume d'heures souhaité** (Desired hours volume): e.g., "2 h"
8. **Années d'expériences souhaitées** (Desired years of experience): e.g., "1 - 3"
9. **Date de création du besoin** (Need creation date): e.g., "24/02/2025"
10. **Langues souhaitées** (Desired languages): Multi-select with extensive language list (Russe, Français, Anglais, etc.)
11. **Client**: e.g., "Client 4"
12. **Objectif de la formation** (Formation objective): e.g., "--"
13. **Téléphone de l'entreprise** (Company phone): e.g., "01 67 43 48 97"
14. **Budget maximum** (Maximum budget): e.g., "22 €" (admin view)
15. **Commentaires** (Comments): e.g., "--"

**Metadata**:

- "Déposé par [Name]" (Deposited by) - e.g., "Déposé par Bro Bro"

**Action Buttons**:

- "Documents Admin (0)" button
- "Partager la mission à toute la base Mentore" (Share mission to entire Mentore database) button
- "Modifier" (Modify) button
- "Supprimer" (Delete) button

**Notes Sections**:

- "Notes internes de l'entreprise" (Internal company notes) - Text area
- "Effectif formé hors émargement sur Mentore" (Trained staff outside Mentore attendance) - Number input (default: 0)
- "Notes internes Admin Mentore" (Internal Admin Mentore notes) - Text area

**Formateurs (Instructors) Sections**:

1. **Formateur(s) sélectionné(s)** (Selected instructor(s)):
   - Shows selected instructors with details:
     - Rating (e.g., "🌟 3,4")
     - Name
     - Experience range (e.g., "1 - 3 ans d'expérience")
     - Pricing: "0€ /HT toutes commissions comprises" and "0€ /HT rémunération formateur"
     - Details: Role, Skills, Location, Phone, Languages, Level, Mission count
     - Status: "Attente programme" (Waiting for program)
     - "Ajouter un document" (Add a document) button
     - "Commentaire Admin" (Admin comment) button
     - "Voir les détails >" (See details) link

2. **Formateur(s) suggéré(s)** (Suggested instructor(s)):
   - Shows suggested instructors with:
     - Rating
     - Name and experience
     - Pricing information
     - Skills, location, phone, languages, level
     - "Proposer la mission" (Propose the mission) button
     - "Commentaire Admin" button
     - "Voir les détails >" link
   - Filter button available
   - Shows result count (e.g., "39 résultats")

## 3. Admin Tab - Administrative Workflow

### Workflow Steps (Left Sidebar)

The Admin tab shows a **10-step administrative workflow**:

1. **Vérifications des informations** (Information verification) - Currently active
2. **Convention et programme** (Convention and program)
3. **Analyse des besoins** (Needs analysis)
4. **Convocation** (Summons/Convocation)
5. **Ordre de mission** (Mission order)
6. **Attestation de fin de mission** (End of mission certificate)
7. **Questionnaires de satisfaction** (Satisfaction questionnaires)
8. **Documents formateur** (Instructor documents)
9. **Facturation** (Billing)
10. **Dossier complet** (Complete file)

### Step 1: Vérification des informations (Information Verification)

**Section Title**: "Vérification des informations"
**Description**: Lorem ipsum placeholder text explaining the step

**Information Display** (Read-only view):

- **Date de début** (Start date): e.g., "24/02/2025"
- **Date de fin** (End date): "Manquant" (Missing)
- **Format de la formation** (Formation format): e.g., "Distanciel"
- **Lieu de la formation** (Formation location): e.g., "Distanciel"
- **Volume d'heures souhaitées** (Desired hours volume): e.g., "2"
- **Horaires** (Schedule): "Manquant" (Missing)
- **Entité** (Entity): e.g., "Client 4"
- **Adresse de l'entreprise** (Company address): e.g., "5 Rue de Dunkerque, 75010 Paris, France"
- **SIRET**: e.g., "102929999"
- **Nom du représentant** (Representative name): e.g., "Bro Bro"
- **Mode de formation** (Formation mode): "Manquant" (Missing)

**Action**: "Modifier" (Modify) button to edit information

**Ajout des apprenants** (Add learners) Section:

1. **CSV Import Option**:
   - "Importer une liste en CSV" (Import a CSV list) button
   - File upload: "Click to upload a file" / "Choose File" button
   - Instructions: "Le fichier importé doit être obligatoirement au format CSV et composé de 3 colonnes : \"prenom\", \"nom\", \"fonction\", \"groupe\" et \"email\""
   - "Template de CSV" (CSV template) button

2. **Manual Entry Option**:
   - "Ajoutez des apprenants manuellement" (Add learners manually)
   - Form fields:
     - "Prénom" (First name) - textbox
     - "Nom" (Last name) - textbox
     - "Fonction" (Function/Role) - textbox
     - "Groupe" (Group) - textbox
     - "Email" - textbox
     - "Ajouter" (Add) button
   - "OU" (OR) separator

**Apprenants inscrits** (Registered learners) Section:

- Shows list of registered learners (if any)

**Audit oral** (Oral audit) Section:

- "Audit oral - Personnes à contacter pour l'audit des besoins" (Oral audit - People to contact for needs audit)
- Options:
  - "Ajouter tous les apprenants" (Add all learners) link
  - "ou" (or)
  - "Ajouter un contact manuellement" (Add a contact manually) link

**Validation**:

- Message: "Si vous avez vérifié les informations et ajouté tous les apprenants vous pouvez valider l'étape" (If you have verified the information and added all learners you can validate the step)
- "Valider l'étape de vérification des informations" (Validate the information verification step) button

## 4. Navigation Structure

### Main Sidebar Navigation

**APP DATA Section**:

- KPI
- Utilisateurs (Users)
- Besoins Entreprises (Company Needs)
- Besoins OF (OF Needs) - Current section
- Formateurs (Instructors)
- Clients
- Emargements (Attendance sheets)
- Messagerie (Messaging) - Shows "10+" badge
- Audits
- Questionnaires
- Brouillons (Drafts)
- Planning
- Facturation (Billing)
- Génération doc (Document generation)

**SETUP Section**:

- Branding
- Pages
- Header / Footer
- Emails
- Settings

## 5. Key Data Fields Identified

### Besoin OF Core Fields

From the Informations tab, the following fields are used:

1. **Matière enseignée** (Subject taught) - Text
2. **Compétences secondaires** (Secondary skills) - Multi-select
3. **Nombre de personnes à former** (Number of people to train) - Number
4. **Format de la formation** (Formation format) - Select (Distanciel, etc.)
5. **Date de début souhaitée** (Desired start date) - Date
6. **Modalités de la formation** (Formation modalities) - Select (Collectif, Individuel)
7. **Volume d'heures souhaité** (Desired hours volume) - Number with unit
8. **Années d'expériences souhaitées** (Desired years of experience) - Range (e.g., "1 - 3")
9. **Date de création du besoin** (Need creation date) - Date
10. **Langues souhaitées** (Desired languages) - Multi-select
11. **Client** - Reference to client
12. **Objectif de la formation** (Formation objective) - Text
13. **Téléphone de l'entreprise** (Company phone) - Phone number
14. **Budget maximum** (Maximum budget) - Currency
15. **Commentaires** (Comments) - Text

### Administrative Fields (Admin Tab)

From Step 1 (Vérification des informations):

1. **Date de début** (Start date) - Date
2. **Date de fin** (End date) - Date (can be missing)
3. **Format de la formation** (Formation format) - Text
4. **Lieu de la formation** (Formation location) - Text
5. **Volume d'heures souhaitées** (Desired hours volume) - Number
6. **Horaires** (Schedule) - Text (can be missing)
7. **Entité** (Entity) - Text/Reference
8. **Adresse de l'entreprise** (Company address) - Address
9. **SIRET** - Number/Text
10. **Nom du représentant** (Representative name) - Text
11. **Mode de formation** (Formation mode) - Text (can be missing)

### Learner (Apprenant) Fields

From the CSV import and manual entry:

1. **Prénom** (First name) - Text
2. **Nom** (Last name) - Text
3. **Fonction** (Function/Role) - Text
4. **Groupe** (Group) - Text
5. **Email** - Email

## 6. Workflow Observations

### Administrative Workflow

The Admin tab implements a **sequential workflow** with 10 steps. Each step appears to be:

- Clickable from the left sidebar
- Shows current step content in the main area
- Likely has validation before moving to next step
- Tracks completion status

### Status Management

From the list view, statuses observed:

- "En cours" (In progress)
- Visibility states: "Masquée" (Hidden) or view counts

### Actions Available

**From List View**:

- View details ("Consulter")
- Create new ("Créer un besoin")
- Filter ("Filtres")
- Select workspace/client

**From Detail View - Informations Tab**:

- Modify ("Modifier")
- Delete ("Supprimer")
- Archive ("Archiver le besoin")
- Modify client type ("Modifier le type de client")
- Share mission ("Partager la mission à toute la base Mentore")
- View documents ("Documents Admin")

**From Detail View - Admin Tab**:

- Navigate between workflow steps
- Modify information ("Modifier")
- Add learners (CSV or manual)
- Add audit contacts
- Validate step ("Valider l'étape")

## 7. Comparison with Current Drizzle Schema

### Fields Present in Bubble but Not in Current Schema

1. **Subject/Matière enseignée** - Not in current schema
2. **Secondary skills/Compétences secondaires** - Not in current schema
3. **Desired years of experience/Années d'expériences souhaitées** - Not in current schema
4. **Desired languages/Langues souhaitées** - Not in current schema
5. **Company phone/Téléphone de l'entreprise** - Not in current schema
6. **Maximum budget/Budget maximum** - Not in current schema
7. **Formation mode/Mode de formation** - Not in current schema
8. **Schedule/Horaires** - Not in current schema
9. **End date/Date de fin** - Not in current schema
10. **Representative name/Nom du représentant** - Not in current schema
11. **Learner fields**: Function, Group - Not in current apprenants schema (only has first_name, last_name, email)

### Fields Present in Both

1. **Name** - Maps to `name` in formations
2. **Description** - Maps to `description` in formations
3. **Duration/Volume d'heures** - Maps to `duree` in formations
4. **Modality/Format** - Maps to `modalite` enum
5. **Status** - Maps to `statut` enum
6. **Client** - Needs `clientId` relationship (currently missing)
7. **Created date** - Maps to `createdAt`
8. **Workspace** - Maps to `workspaceId`

## 8. Next Steps for Analysis

To complete the analysis, the following should be explored:

1. Click through other Admin workflow steps (2-10) to see their content
2. Click "Créer un besoin" to see the creation form structure
3. Click "Modifier" to see the edit form
4. Explore filter functionality
5. Check other tabs (Profils à proposer, etc.)
6. Analyze network requests for API structure
7. Document remaining workflow steps

# Bubble Application - Administrative Workflow Documentation

## Overview

The Admin tab in the Besoin OF detail view contains a **10-step administrative workflow** for managing the complete lifecycle of a formation need. This workflow guides administrators through all necessary steps from initial verification to final completion.

## Workflow Structure

The workflow is displayed with:

- **Left Sidebar**: List of all 10 steps (clickable navigation)
- **Main Content Area**: Current step's content and actions
- **Step Validation**: Each step can be validated before proceeding

## Workflow Steps

### Step 1: Vérifications des informations (Information Verification)

**Purpose**: Verify and complete basic formation information and add learners.

**Content**:

1. **Information Display Section**:
   - Shows key formation details in read-only format
   - Fields displayed:
     - Date de début (Start date)
     - Date de fin (End date) - Can be "Manquant" (Missing)
     - Format de la formation (Formation format)
     - Lieu de la formation (Formation location)
     - Volume d'heures souhaitées (Desired hours volume)
     - Horaires (Schedule) - Can be "Manquant"
     - Entité (Entity/Client)
     - Adresse de l'entreprise (Company address)
     - SIRET
     - Nom du représentant (Representative name)
     - Mode de formation (Formation mode) - Can be "Manquant"
   - **Action**: "Modifier" (Modify) button to edit information

2. **Ajout des apprenants (Add Learners) Section**:

   **Option A: CSV Import**:
   - "Importer une liste en CSV" (Import a CSV list) button
   - File upload interface
   - **CSV Format Requirements**:
     - Must be CSV format
     - Required columns: "prenom", "nom", "fonction", "groupe", "email"
   - "Template de CSV" (CSV template) button for download

   **Option B: Manual Entry**:
   - "Ajoutez des apprenants manuellement" (Add learners manually)
   - Form fields:
     - Prénom (First name)
     - Nom (Last name)
     - Fonction (Function/Role)
     - Groupe (Group)
     - Email
   - "Ajouter" (Add) button

3. **Apprenants inscrits (Registered Learners) Section**:
   - Displays list of already registered learners

4. **Audit oral (Oral Audit) Section**:
   - "Personnes à contacter pour l'audit des besoins" (People to contact for needs audit)
   - Options:
     - "Ajouter tous les apprenants" (Add all learners) - Quick action
     - "Ajouter un contact manuellement" (Add a contact manually)

5. **Validation**:
   - Message: "Si vous avez vérifié les informations et ajouté tous les apprenants vous pouvez valider l'étape"
   - "Valider l'étape de vérification des informations" (Validate the information verification step) button

**Completion Criteria**:

- Information verified (or modified if needed)
- All learners added (via CSV or manually)
- Audit contacts added (if applicable)
- Step validated

---

### Step 2: Convention et programme (Convention and Program)

**Purpose**: Generate and manage formation convention documents and training program.

**Content**:

1. **Convention de formation (Formation Convention) Section**:
   - "Générer" (Generate) button - Generates the convention document
   - "Modifier" (Modify) button - Allows editing convention details
   - "Télécharger" (Download) button - Downloads the generated convention

2. **Programme de formation (Formation Program) Section**:
   - "Renseigner le programme" (Fill in the program) button - Opens form to enter program details
   - "Télécharger" (Download) button - Downloads the program document

3. **Validation**:
   - "Valider l'étape convention et programme" (Validate the convention and program step) button

**User Flow**:

1. Admin reviews formation information
2. Clicks "Générer" to create convention document
3. Optionally clicks "Modifier" to adjust convention details
4. Clicks "Renseigner le programme" to fill in program details
5. Downloads both documents if needed
6. Validates step to proceed

**Completion Criteria**:

- Convention generated (and optionally modified)
- Program filled in
- Step validated

---

### Step 3: Analyse des besoins (Needs Analysis)

**Purpose**: Schedule and manage needs analysis sessions (both digital and with instructors).

**Content**:

1. **Sub-tabs**:
   - "Analyse des besoins digitale" (Digital needs analysis)
   - "Analyse des besoins formateur" (Instructor needs analysis)

2. **Scheduling Section**:
   - "⏳ à programmer" (To be scheduled) button - Opens scheduling interface

3. **Participants Table**:
   - Columns: Prénom NOM (First name LAST NAME), Email, Statut (Status)
   - Shows list of people involved in needs analysis

4. **Validation**:
   - "Valider l'étape analyse des besoins" (Validate the needs analysis step) button

**User Flow**:

1. Admin navigates to step
2. Selects appropriate sub-tab (digital or instructor)
3. Clicks "⏳ à programmer" to schedule analysis sessions
4. Reviews participants list
5. Validates step when analysis is scheduled/completed

**Completion Criteria**:

- Needs analysis sessions scheduled
- Participants identified
- Step validated

---

### Step 4: Convocation (Summons/Convocation)

**Purpose**: Generate and send convocation documents to all learners.

**Content**:

1. **Actions Section**:
   - "Générer pour tous les apprenants" (Generate for all learners) button - Bulk generation
   - "Programmer un envoi groupé" (Schedule a group sending) button - Schedule email sending
   - "Modifier les infos du besoin" (Modify the need information) button - Edit formation details

2. **Apprenants List**:
   - Shows count: "Apprenants (0)" - Displays number of learners
   - Lists all learners who will receive convocations

3. **Validation**:
   - "Valider l'étape envoi des convocation" (Validate the convocation sending step) button

**User Flow**:

1. Admin reviews learner list
2. Optionally modifies formation information if needed
3. Clicks "Générer pour tous les apprenants" to create convocation documents
4. Optionally clicks "Programmer un envoi groupé" to schedule automatic email sending
5. Validates step

**Completion Criteria**:

- Convocations generated for all learners
- Optionally scheduled for sending
- Step validated

---

### Step 5: Ordre de mission (Mission Order)

**Purpose**: Generate mission orders for instructors and manage positioning tests.

**Content**:

1. **Ordre de mission à signer (Mission Order to Sign) Section**:
   - "Générer" (Generate) button - Creates the mission order document
   - "Modifier" (Modify) button - Allows editing mission order details
   - "Télécharger" (Download) button - Downloads the generated document

2. **Test de positionnement (Positioning Test) Section**:
   - File upload: "Télécharger le document" (Download the document) / "Choose File" button
   - Upload interface for positioning test document
   - Action buttons (likely for managing uploaded document)

3. **Validation**:
   - "Valider l'étape ordre de mission" (Validate the mission order step) button

**User Flow**:

1. Admin clicks "Générer" to create mission order
2. Optionally clicks "Modifier" to adjust details
3. Downloads mission order for review/signing
4. Uploads positioning test document if applicable
5. Validates step

**Completion Criteria**:

- Mission order generated (and optionally modified)
- Positioning test uploaded (if required)
- Step validated

---

### Step 6: Attestation de fin de mission (End of Mission Certificate)

**Purpose**: Generate and send end-of-mission certificates to learners.

**Content**:

1. **Actions Section**:
   - "Générer pour tous les apprenants" (Generate for all learners) button - Bulk generation
   - "Programmer un envoi groupé" (Schedule a group sending) button - Schedule email sending
   - "Modifier les infos du besoin" (Modify the need information) button - Edit formation details

2. **Learner Sources**:
   - "Apprenants issus du listing mission (0)" (Learners from mission listing) - Shows count
   - "Apprenants issus de l'émargement (0)" (Learners from attendance) - Shows count
   - Distinguishes between learners from initial listing vs. those who actually attended

3. **Validation**:
   - "Valider l'étape envoi des attestations" (Validate the certificate sending step) button

**User Flow**:

1. Admin reviews learner lists (from listing vs. attendance)
2. Optionally modifies formation information
3. Clicks "Générer pour tous les apprenants" to create certificates
4. Optionally schedules group email sending
5. Validates step

**Completion Criteria**:

- Certificates generated for all learners
- Optionally scheduled for sending
- Step validated

---

### Step 7: Questionnaires de satisfaction (Satisfaction Questionnaires)

**Purpose**: Manage satisfaction questionnaires sent to learners after formation completion.

**Content**:

1. **Add Learners Section**:
   - "Ajouter manuellement" (Add manually) button - Manual entry
   - "Importer depuis l'émargement" (Import from attendance) button - Import from attendance records
     - Shows count: "0 a émargé" (0 signed attendance)
   - "Importer depuis le listing admin" (Import from admin listing) button - Import from admin list
     - Shows count: "0 enregistré" (0 registered)

2. **Scheduling Button**:
   - "🔥 à programmer | ❄️ à programmer" (To be scheduled) button - Schedules both questionnaire types

3. **Sub-tabs**:
   - "🔥 Questionnaire à chaud" (Hot questionnaire) - Immediate post-formation
   - "❄️ Questionnaire à froid" (Cold questionnaire) - Follow-up after some time

4. **Learners Table**:
   - Columns: Prénom NOM, Email, Note (Rating), Statut (Status), Actions
   - Shows added learners and their questionnaire status

5. **Information Message**:
   - "Le questionnaire sera programmé par votre conseiller Mentore une fois les apprenants ajoutés manuellement après la formation, et envoyé automatiquement sous 48h. Vous n'avez aucune action à réaliser."
   - (Questionnaire will be scheduled by your Mentore advisor once learners are added manually after formation, and sent automatically within 48h. You have no action to take.)

6. **Validation**:
   - "Valider l'étape questionnaires de suivi" (Validate the follow-up questionnaires step) button

**User Flow**:

1. Admin adds learners (manually, from attendance, or from admin listing)
2. Selects questionnaire type tab (hot or cold)
3. Reviews learners list
4. Optionally schedules sending
5. Validates step

**Completion Criteria**:

- Learners added to questionnaire list
- Questionnaires scheduled (automatically or manually)
- Step validated

---

### Step 8: Documents formateur (Instructor Documents)

**Purpose**: Collect and manage required documents from instructors.

**Content**:

1. **Document Types** (each with upload interface):
   - **Fiche d'entretien** (Interview sheet) - "Commentaire Admin" (Admin comment) button
   - **CV** - File upload: "Télécharger le document" / "Choose File"
   - **Diplôme** (Diploma) - File upload
   - **Attestation URSAFF** (URSAFF certificate) - File upload
   - **Attestation de NDA** (NDA certificate) - File upload
   - **Contrat de prestataire (signé)** (Signed provider contract) - File upload

2. **Validation**:
   - "Valider l'étape documents formateur" (Validate the instructor documents step) button

**User Flow**:

1. Admin reviews required documents list
2. For each document type:
   - Uploads file using "Choose File" button
   - Adds admin comments if needed (for interview sheet)
3. Reviews all uploaded documents
4. Validates step when all required documents are collected

**Completion Criteria**:

- All required instructor documents uploaded
- Admin comments added where needed
- Step validated

---

### Step 9: Facturation (Billing)

**Purpose**: Manage billing information, payment methods, and invoice status tracking.

**Content**:

1. **Mode de financement (Financing Mode)**:
   - Shows current selection: "OPCO" with "Plan de formation" (Training plan)
   - Clickable to change financing mode

2. **Méthode de paiement (Payment Method)**:
   - Options:
     - "Via Mentore" (Via Mentore) - Selected
     - "En direct mensuel" (Direct monthly) - Clickable
     - "En direct fin de mission" (Direct end of mission) - Clickable

3. **Statut de la facture entreprise (Company Invoice Status)**:
   - **Envoyée (Sent)**: Toggle between "Oui" (Yes) / "Non" (No)
   - **Payée (Paid)**: Toggle between "Oui" (Yes) / "Non" (No)

4. **Statut de la facture formateur (Instructor Invoice Status)**:
   - **Virement réalisé (Transfer completed)**: Toggle between "Oui" (Yes) / "Non" (No)

5. **Validation**:
   - "Valider l'étape facturation" (Validate the billing step) button

**User Flow**:

1. Admin reviews financing mode
2. Selects payment method
3. Updates invoice statuses:
   - Marks company invoice as sent/paid
   - Marks instructor transfer as completed
4. Validates step

**Completion Criteria**:

- Financing mode confirmed
- Payment method selected
- Invoice statuses updated
- Step validated

---

### Step 10: Dossier complet (Complete File)

**Purpose**: Final review of all administrative documents and data for the formation.

**Content**:

1. **Données liées à l'émargement (Attendance-related Data) Section**:
   - Shows: "0 session créé / 0 signature enregistrée" (0 session created / 0 signature recorded)
   - Button (likely to view/manage attendance data)

2. **Documents déposés par le formateur (Documents Deposited by Instructor) Section**:
   - Message: "Aucun document déposé par le formateur pour cette mission !" (No documents deposited by instructor for this mission!)
   - Shows list of documents uploaded by instructor (if any)

**User Flow**:

1. Admin reviews attendance data summary
2. Reviews documents deposited by instructor
3. Verifies all previous steps are completed
4. Final review before closing the administrative file

**Completion Criteria**:

- All previous steps validated
- Attendance data reviewed
- Instructor documents reviewed
- Complete file ready for closure

## Workflow Patterns

### Navigation

- Steps are clickable from the left sidebar
- Current step is highlighted/active
- Users can navigate between steps (likely with restrictions based on completion status)

### Step Validation

- Each step has a validation mechanism
- Steps must be completed in order (likely)
- Validation button appears when step requirements are met

### Data Persistence

- Information entered in each step is saved
- Users can return to previous steps to modify information
- Progress is tracked across the workflow

## Integration with Formation Data

The workflow steps reference and modify data from the main Besoin OF record:

- Client information
- Formation details (dates, format, location, etc.)
- Learners (apprenants)
- Instructors (formateurs)
- Documents
- Financial information

## User Flow Patterns

### Sequential Workflow

The workflow follows a **sequential pattern** where each step builds upon the previous:

1. **Information Verification** → Establishes foundation data
2. **Convention & Program** → Creates legal/training documents
3. **Needs Analysis** → Schedules analysis sessions
4. **Convocation** → Notifies learners
5. **Mission Order** → Formalizes instructor assignment
6. **End Certificate** → Completes formation documentation
7. **Satisfaction Questionnaires** → Collects feedback
8. **Instructor Documents** → Ensures compliance
9. **Billing** → Handles financial closure
10. **Complete File** → Final review

### Common Patterns Across Steps

1. **Document Generation**: Steps 2, 4, 5, 6 involve generating documents
2. **Bulk Operations**: Steps 4, 6 support bulk generation for all learners
3. **Scheduled Actions**: Steps 4, 6, 7 support scheduled email sending
4. **File Uploads**: Steps 5, 8 require document uploads
5. **Status Tracking**: Step 9 tracks invoice/payment statuses
6. **Validation**: Each step requires explicit validation to proceed

## How the Workflow Helps Manage Administrative Aspects

### 1. **Structured Process**

- Ensures no administrative step is missed
- Provides clear checklist of required actions
- Guides users through complex multi-step processes

### 2. **Document Management**

- Centralized document generation and storage
- Tracks document status (generated, modified, downloaded)
- Links documents to specific workflow steps

### 3. **Learner Management**

- Tracks learners from initial listing through attendance
- Supports bulk operations (CSV import, bulk generation)
- Distinguishes between different learner sources

### 4. **Compliance Tracking**

- Ensures required documents are collected
- Tracks completion status of each administrative task
- Provides audit trail through step validation

### 5. **Financial Management**

- Tracks billing status at multiple levels (company, instructor)
- Manages different payment methods
- Links financial data to formation lifecycle

### 6. **Automation Support**

- Scheduled email sending for convocations and certificates
- Automatic questionnaire sending (48h after formation)
- Bulk operations reduce manual work

## Caveats and Issues Identified

### 1. **Limited Progress Visibility**

- **Issue**: No clear visual indicator of overall workflow progress
- **Impact**: Users may not know how many steps remain
- **Improvement**: Add progress bar or step completion indicators

### 2. **No Step Dependencies Enforced**

- **Issue**: Users can navigate to any step, potentially skipping required steps
- **Impact**: May lead to incomplete administrative files
- **Improvement**: Enforce sequential completion or clearly mark optional steps

### 3. **Missing Data Validation**

- **Issue**: Some fields show "Manquant" (Missing) but step can still be validated
- **Impact**: Incomplete data may be accepted
- **Improvement**: Require critical fields before validation

### 4. **Limited Error Handling**

- **Issue**: CSV import errors may not be clearly communicated
- **Impact**: Users may not know why import failed
- **Improvement**: Detailed validation messages and error reporting

### 5. **No Bulk Edit Capabilities**

- **Issue**: Must modify information step-by-step
- **Impact**: Time-consuming for multiple formations
- **Improvement**: Allow bulk editing across multiple formations

### 6. **Document Version Control**

- **Issue**: No clear versioning when documents are regenerated
- **Impact**: May lose track of document versions
- **Improvement**: Version history and document comparison

### 7. **Limited Search/Filter in Steps**

- **Issue**: Large learner lists may be hard to navigate
- **Impact**: Difficult to find specific learners
- **Improvement**: Add search and filter capabilities within steps

## Improvements for Modernized Version

### 1. **Enhanced Progress Tracking**

**Current**: Basic step list in sidebar
**Improved**:

- Visual progress indicator (e.g., "Step 3 of 10")
- Completion percentage
- Color-coded step status (not started, in progress, completed, blocked)
- Estimated time remaining per step

### 2. **Smart Validation**

**Current**: Manual validation button
**Improved**:

- Real-time validation as user completes actions
- Clear indication of what's missing
- Auto-validation when all requirements met
- Prevent validation if critical data missing

### 3. **Better Document Management**

**Current**: Basic generate/modify/download
**Improved**:

- Document preview before download
- Version history
- Document templates with variables
- Batch document operations
- Document signing workflow integration

### 4. **Improved Data Entry**

**Current**: Manual entry or CSV import
**Improved**:

- Inline editing in tables
- Bulk edit capabilities
- Data validation with helpful error messages
- Auto-save drafts
- Field-level help text

### 5. **Enhanced Scheduling**

**Current**: Basic scheduling buttons
**Improved**:

- Calendar view for scheduled actions
- Recurring schedule support
- Email template customization
- Delivery status tracking
- Reminder notifications

### 6. **Workflow Customization**

**Current**: Fixed 10-step workflow
**Improved**:

- Configurable workflow steps per formation type
- Optional steps clearly marked
- Custom step ordering
- Step templates for common scenarios

### 7. **Better Status Management**

**Current**: Simple toggles (Oui/Non)
**Improved**:

- Status history timeline
- Status change notifications
- Automated status transitions
- Status-based permissions

### 8. **Integration Improvements**

**Current**: Manual data entry
**Improved**:

- API integrations for document generation
- Automated data sync from external systems
- Webhook support for status changes
- Export capabilities for reporting

### 9. **User Experience Enhancements**

**Current**: Basic form interfaces
**Improved**:

- Keyboard shortcuts for common actions
- Undo/redo functionality
- Contextual help and tooltips
- Mobile-responsive design
- Offline capability with sync

### 10. **Analytics and Reporting**

**Current**: No analytics visible
**Improved**:

- Step completion analytics
- Time-to-completion metrics
- Bottleneck identification
- Administrative efficiency reports
- Compliance tracking dashboard

## Technical Recommendations

### Database Schema Additions

1. **Workflow Step Tracking Table**:
   - Track step completion status
   - Store completion timestamps
   - Link to user who completed step

2. **Document Versions Table**:
   - Version history for generated documents
   - Track modifications
   - Store document metadata

3. **Scheduled Actions Table**:
   - Track scheduled emails/documents
   - Store schedule details
   - Track execution status

4. **Workflow Templates Table**:
   - Store workflow configurations
   - Support different formation types
   - Enable workflow customization

### API Design Considerations

1. **Step Validation Endpoints**:
   - Validate step requirements before allowing completion
   - Return detailed validation errors
   - Support partial completion

2. **Document Generation Service**:
   - Template-based document generation
   - Support for PDF, Word formats
   - Batch generation capabilities

3. **Scheduling Service**:
   - Queue-based email/document sending
   - Retry logic for failed sends
   - Delivery status tracking

## Notes

- The workflow is sequential but allows navigation between steps
- Each step has specific completion requirements
- Documents are generated on-demand rather than pre-generated
- The workflow supports both manual and automated processes
- Some steps depend on data from previous steps (e.g., learners from Step 1 used in Step 4)
- The final step serves as a review/checkpoint before closing the administrative file

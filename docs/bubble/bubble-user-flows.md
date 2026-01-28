# Bubble Application - User Flows Documentation

## Overview

This document details the step-by-step user flows for managing "Besoins OF" (Formations) in the Bubble.io application.

## Flow 1: Viewing Besoins OF List

### Steps

1. **Access Admin Portal**
   - User navigates to: `https://app.mentore.fr/version-test/admin`
   - User logs in (if not already authenticated)
   - _[Document login process if relevant]_

2. **Navigate to Besoins OF Tab**
   - User clicks on "Besoins OF" tab in admin navigation
   - URL changes to: `?tab=besoins%20OF`
   - _[Document the exact navigation method]_

3. **View List**
   - List of Besoins OF loads
   - _[Document default view - all items, filtered, etc.]_
   - _[Document what information is visible in list view]_

### Variations

#### With Filters Applied

_[Document how filters work]_

1. User selects filter criteria
2. List updates to show filtered results
3. _[Document filter persistence, URL params, etc.]_

#### With Search

_[Document search functionality]_

1. User enters search term
2. List updates in real-time or on submit
3. _[Document search behavior]_

### Exit Points

- Click on a Besoin OF to view details
- Click "Create" to create new
- Navigate to another section

## Flow 2: Creating a New Besoin OF

### Steps

1. **Initiate Creation**
   - From list view: Click "Create" or "+" button
   - _[Document button location and label]_
   - Form opens: _[modal, new page, etc.]_

2. **Fill Basic Information** (Step 1 or Section 1)
   - Enter formation name
   - Select client from dropdown
   - Enter duration
   - Select modality
   - _[Document all fields in this step]_
   - _[Document validation that occurs]_

3. **Fill Programme Information** (Step 2 or Section 2)
   - Add modules
   - Enter module details (name, duration, objectives)
   - Set module order
   - _[Document all fields in this step]_

4. **Fill Qualiopi/Compliance Information** (Step 3 or Section 3)
   - Select thematic
   - Select sub-thematic
   - Enter code RNCP (if applicable)
   - Select financement type
   - _[Document all fields in this step]_

5. **Review and Submit**
   - Review entered information
   - _[Is there a review step?]_
   - Click "Save" or "Create" button
   - _[Document button label and location]_

6. **Post-Submission**
   - Success message displayed: _[document message]_
   - Redirect to: _[detail view, list view, etc.]_
   - _[Document what happens after creation]_

### Validation Points

_[Document when validation occurs and what happens]_

- On field blur
- On step navigation
- On form submit
- Error display: _[how errors are shown]_

### Cancel/Back Actions

_[Document cancel and back button behavior]_

- Cancel: _[what happens, confirmation dialog?]_
- Back: _[goes to previous step or exits form?]_

## Flow 3: Editing an Existing Besoin OF

### Steps

1. **Access Edit Form**
   - From list view: Click on Besoin OF item or "Edit" button
   - From detail view: Click "Edit" button
   - _[Document exact method]_

2. **Form Loads with Existing Data**
   - All fields pre-populated
   - _[Document any read-only fields]_

3. **Modify Fields**
   - User changes desired fields
   - _[Document which fields can be edited]_

4. **Save Changes**
   - Click "Save" button
   - _[Document validation that occurs]_

5. **Post-Save**
   - Success message: _[document message]_
   - Redirect to: _[detail view, list view, etc.]_
   - _[Document what happens after save]_

### Special Cases

#### Status Change During Edit

_[Document how status changes work]_

1. User changes status dropdown
2. _[Any confirmation required?]_
3. _[Any restrictions based on current status?]_

#### Editing with Restrictions

_[Document any restrictions on editing]_

- Cannot edit when status is "Terminée"?
- Cannot edit certain fields in certain statuses?
- _[Document all restrictions]_

## Flow 4: Viewing Besoin OF Details

### Steps

1. **Access Detail View**
   - From list: Click on Besoin OF item
   - _[Document exact method]_

2. **View Information**
   - Header information displayed
   - Main content sections displayed
   - Related data displayed (modules, sessions, etc.)
   - _[Document all sections visible]_

3. **Available Actions**
   - Edit button
   - Delete button
   - Other actions
   - _[Document all available actions]_

### Navigation from Detail View

_[Document where user can go from detail view]_

- Back to list
- Edit form
- Related entities
- Other sections

## Flow 5: Changing Status

### Steps

1. **Access Status Change**
   - From list view: _[dropdown in list item?]_
   - From detail view: _[status dropdown or button?]_
   - From edit form: _[status field?]_

2. **Select New Status**
   - User selects new status from dropdown
   - _[Document available options based on current status]_

3. **Confirmation** (if applicable)
   - Confirmation dialog appears: _[document message]_
   - User confirms or cancels

4. **Status Updates**
   - Status changes in database
   - UI updates to reflect new status
   - _[Any notifications sent?]_

### Status Transition Rules

_[Document allowed transitions]_

- En attente → En cours: _[allowed? restrictions?]_
- En attente → Terminée: _[allowed? restrictions?]_
- En cours → Terminée: _[allowed? restrictions?]_
- En cours → En attente: _[allowed? restrictions?]_
- Terminée → [any]: _[allowed? restrictions?]_

## Flow 6: Filtering and Searching

### Filtering Flow

1. **Access Filters**
   - User clicks filter button or opens filter panel
   - _[Document filter UI location]_

2. **Apply Filters**
   - User selects filter criteria
   - _[Document available filters]_
   - User applies filters

3. **View Filtered Results**
   - List updates to show filtered items
   - _[Document how filters are displayed/applied]_

4. **Clear Filters**
   - User clicks "Clear" or removes filter criteria
   - List returns to default view

### Search Flow

1. **Enter Search Term**
   - User types in search field
   - _[Document search field location]_

2. **Search Executes**
   - Real-time search: _[results update as user types]_
   - Submit search: _[user presses enter or clicks search button]_

3. **View Results**
   - List shows matching items
   - _[Document what fields are searched]_

4. **Clear Search**
   - User clears search field
   - List returns to default view

## Flow 7: Deleting a Besoin OF

### Steps

1. **Initiate Delete**
   - From list: Click delete button/icon on item
   - From detail view: Click "Delete" button
   - _[Document exact method]_

2. **Confirmation**
   - Confirmation dialog appears
   - Message: _[document confirmation message]_
   - User confirms or cancels

3. **Deletion**
   - If confirmed: Besoin OF is deleted
   - Success message: _[document message]_
   - Redirect to: _[list view, etc.]_

### Restrictions

_[Document when deletion is not allowed]_

- Cannot delete if status is "En cours"?
- Cannot delete if related data exists?
- _[Document all restrictions]_

## Flow 8: Duplicating a Besoin OF

### Steps (if feature exists)

1. **Initiate Duplicate**
   - From list: Click duplicate button
   - From detail view: Click "Duplicate" button
   - _[Document exact method]_

2. **Duplicate Created**
   - New Besoin OF created with copied data
   - _[What fields are copied? What is reset?]_
   - _[Document default values for duplicated item]_

3. **Edit Duplicate**
   - User is taken to edit form for new item
   - Or: New item appears in list
   - _[Document what happens after duplication]_

## Error Handling Flows

### Validation Errors

_[Document how validation errors are displayed]_

1. User submits form with invalid data
2. Errors displayed: _[inline, summary, etc.]_
3. User corrects errors
4. Resubmits

### Network Errors

_[Document how network errors are handled]_

1. Error occurs during save/load
2. Error message displayed: _[document message]_
3. User can retry or cancel

### Permission Errors

_[Document how permission errors are handled]_

1. User attempts action without permission
2. Error message or disabled state
3. _[Document behavior]_

## Notes

- _[Any additional observations about user flows]_
- _[Any edge cases or special scenarios]_

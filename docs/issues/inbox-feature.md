# Feature: Boîte de réception (Inbox)

## Summary

Implement a centralized **Inbox** (“Boîte de réception”) for the learning-center admin app: a single place for notifications, comments, and mentions so users can see what needs their attention without hunting across the app.

## Context

- The app already has an Inbox route (`/inbox`) and a sidebar shortcut; the page is currently a placeholder.
- The product goal is to make admin workflows feel effortless and rewarding: users should know exactly what to do and be able to start doing it quickly.
- An Inbox aligns with that by surfacing “things that need you” in one place (similar to Notion’s Inbox below the workspace switcher).

## Requirements

### Core

1. **Notifications**
   - System and workflow notifications (e.g. “Formation X needs your action”, “Deal Y moved to Négociation”).
   - Optional: mark as read / unread; optional filters (e.g. by type, by entity).

2. **Comments**
   - Comments on entities (e.g. formations, deals, clients) with threading if useful.
   - Author, timestamp, and link to the relevant entity/page.

3. **Mentions**
   - @mention users in comments or in rich text (if we add it).
   - Mentioned users see the item in their Inbox and get a notification.

### UX

- Inbox is the central place for “what needs my attention”.
- Entries should be actionable: click → go to the right place to act.
- Consider grouping by type (notifications / comments / mentions) or by time; keep the list scannable.
- Optional: badge count on the sidebar “Boîte de réception” link for unread count.

### Technical (to be refined)

- Notifications/comments/mentions storage (new tables or use of existing DB).
- Real-time or polling for new items (e.g. Supabase Realtime or periodic refresh).
- Permissions: only show items the user is allowed to see (workspace + role).
- Optional: email digest for inactive users.

## Out of scope for initial issue

- Full activity feed / audit log (can be a separate feature).
- In-app chat/messaging (already have “Messagerie”; Inbox is for notifications/comments/mentions).

## Acceptance criteria (draft)

- [ ] User can open Inbox from sidebar and see a list of notifications, comments, and mentions.
- [ ] Each item links to the relevant entity (formation, deal, etc.) or context.
- [ ] User can mark items as read (and optionally filter by read/unread).
- [ ] Mentioned users receive an Inbox entry and (optional) notification.
- [ ] List respects workspace and role (no cross-workspace or forbidden data).
- [ ] Sidebar shows an unread count badge when applicable.

## Notes

- This issue is a placeholder for the full Inbox feature. Implementation will require schema design, API, and UI work.
- Keep the existing `/inbox` route and sidebar entry; replace the placeholder content as the feature is built.

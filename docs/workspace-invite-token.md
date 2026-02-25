# Workspace invite token

This document describes how **workspace invite tokens** work in the app: security model, flows, environment, and how this will integrate with the **email sending feature** when it is built.

## What it is

When an admin invites someone to a workspace, the app creates a **single-use invite** stored in `workspace_invites`. Each invite has:

- `workspace_id`, `email`, `role`, `invited_by`, `expires_at`
- **`token_digest`** — a **cryptographic digest** of the invite token (not the raw token)

The **raw token** (e.g. a UUID) is generated at creation time, sent **only** to the invited user (today: via in-app “copy link”; later: in the invite email). The link they use looks like:

```
https://your-app.com/invite/<raw-token>
```

When they open that URL while logged in, the app **redeems** the invite: it verifies the token, adds them to the workspace, and deletes the invite.

## Why we store a digest, not the raw token

- **Security:** If the database is leaked, an attacker cannot use the stored value to accept invites; they would need the raw token that was sent to the user.
- **Practice:** We never store or log the raw token. We store only a **keyed HMAC-SHA256 digest** (hex) in `token_digest`. Verification is done by recomputing the digest from the token supplied in the URL and comparing it to the stored value.

So:

- **Create invite:** generate raw token → compute digest with server secret → **store digest**, **return raw token** to the client (for the link).
- **Redeem invite:** read raw token from URL → compute digest with same secret → **look up invite by digest** → if found and valid, redeem.

The raw token is only ever in memory and in the link/email the user receives.

## Environment: `INVITE_TOKEN_SECRET`

The digest is computed with **HMAC-SHA256** using a server secret so that digests cannot be forged without the secret.

- **Variable:** `INVITE_TOKEN_SECRET`
- **Required:** Yes, for creating or redeeming invites. If missing or shorter than 16 characters, the app will throw when creating an invite or opening an invite link.
- **Format:** A long, random secret (e.g. 32 bytes in hex). Example generation:

  ```bash
  openssl rand -hex 32
  ```

- **Where to set:**
  - **Local:** In `.env` (see `.env.dev.example`; copy and set `INVITE_TOKEN_SECRET=""` to a real value).
  - **Production / Staging:** In your hosting env (see **Vercel** below) or Supabase secrets, so that the same secret is used across all instances that create or redeem invites.

**Important:** If you change the secret, existing invite links (whose digest was computed with the old secret) will no longer validate. Only new invites created after the change will work.

### Vercel (production / preview)

This project is deployed on Vercel. You must add `INVITE_TOKEN_SECRET` there for invite creation and redemption to work in production.

1. Open [vercel.com](https://vercel.com) → your project → **Settings** → **Environment Variables**.
2. Add a variable:
   - **Name:** `INVITE_TOKEN_SECRET`
   - **Value:** a long random secret (e.g. from `openssl rand -hex 32`). You can use the same value as in your local `.env` so that the same invite links work in both environments if they share the same database, or a different value per environment if you prefer.
   - **Environments:** at least **Production**; add **Preview** too if you use invite links on preview deployments.
3. Save, then **redeploy** the project so the new variable is applied (existing deployments do not pick up env changes until they are redeployed).

## Code locations

| Concern              | Location |
|----------------------|----------|
| Digest computation   | `src/lib/server/invite-token.ts` — `hashInviteToken(rawToken)` |
| Create invite        | `src/routes/(app)/parametres/workspace/+page.server.ts` — action `createInvite` |
| Redeem invite        | `src/routes/invite/[token]/+page.server.ts` — load (resolve invite, add user to workspace, delete invite) |
| Schema               | `src/lib/db/schema/workspace-members.ts` — `workspaceInvites.tokenDigest` |
| Migration            | `supabase/migrations/20260225110000_workspace_invites_token_digest.sql` (rename `token` → `token_digest`, indexes) |

The create action returns `{ success: true, token: rawToken }`. The UI uses that to build the invite URL (e.g. for a “Copy link” button). **Do not** log or persist the raw token on the server.

## Legacy behavior

Invites created **before** the digest migration had the raw token stored in the column that is now `token_digest`. The redeem logic supports those old invites by also matching `token_digest = <raw token from URL>` when the digest lookup fails. So existing invite links continue to work until they expire. New invites only ever store the digest.

## Future: email sending

When you implement **sending invite emails**:

1. **Token flow stays the same.** Create invite → get back the **raw token** in the action response (or from a server-side call that creates the invite). Use it only to build the **accept URL**.
2. **Email content:** The email should include the invite link:  
   `https://<your-app-domain>/invite/<raw-token>`  
   (and optionally login link if they are not yet users).
3. **No raw token in DB or logs.** The backend that sends the email can receive the raw token from the create-invite response and pass it into the email template as the `inviteLink` (or similar). Do not store the raw token in the database or in email logs; the only copy should be in the link the user receives.
4. **Same secret everywhere.** Any server that creates or redeems invites (including background workers that might send emails) must use the same `INVITE_TOKEN_SECRET` so that the digest computed at create time matches the digest computed at redeem time.

So the “email sending feature” is about **when** and **how** we deliver the link (email + template); the **invite token contract** (digest in DB, raw token only in the link) does not change.

## Summary

- **DB:** `workspace_invites.token_digest` — HMAC-SHA256 digest of the invite token (hex).
- **Secret:** `INVITE_TOKEN_SECRET` — required, long random value, same across app instances.
- **Create:** Generate raw token → store digest, return raw token for the link.
- **Redeem:** Hash token from URL → find invite by digest → validate and redeem.
- **Later:** Email feature only needs to put the same invite URL (with raw token) in the email body; no change to token handling.

-- Store workspace invite token as HMAC-SHA256 digest instead of plaintext.
-- Application generates a raw token, sends it to the user (e.g. in link/email), and stores only the digest.

-- Rename column: token -> token_digest (existing rows keep value; new rows store digest only)
ALTER TABLE workspace_invites RENAME COLUMN token TO token_digest;

-- Drop the explicit index on the old column name
DROP INDEX IF EXISTS idx_workspace_invites_token;

-- Replace the unique constraint's index with a named one (constraint name from UNIQUE on token)
ALTER TABLE workspace_invites DROP CONSTRAINT IF EXISTS workspace_invites_token_key;
CREATE UNIQUE INDEX idx_workspace_invites_token_digest ON workspace_invites(token_digest);

-- Add Suivi tracking columns to formation_actions
ALTER TABLE formation_actions
  ADD COLUMN IF NOT EXISTS wait_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_reminded_at timestamptz,
  ADD COLUMN IF NOT EXISTS anticipated_at timestamptz,
  ADD COLUMN IF NOT EXISTS soft_lock_overridden_at timestamptz;

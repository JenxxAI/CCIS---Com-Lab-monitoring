-- ─── Migration 002: Constraints + Audit Columns ──────────────────────────────
-- Run in Supabase SQL Editor after 001_users.sql.
-- Safe to re-run: all statements are idempotent.

-- ─── 1. Unique PC number per lab ─────────────────────────────────────────────
-- Prevents two PC-01 rows in the same lab at the DB level.
-- The application already checks this, but a DB constraint is the authoritative guard.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pcs_lab_id_num_unique'
  ) THEN
    ALTER TABLE pcs ADD CONSTRAINT pcs_lab_id_num_unique UNIQUE (lab_id, num);
  END IF;
END $$;

-- ─── 2. updated_at columns ───────────────────────────────────────────────────
-- Tracks the last modification time for change-detection, debugging, and auditing.
-- DEFAULT now() fills the column for all pre-existing rows without requiring a migration query.

ALTER TABLE pcs   ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ─── 3. Auto-update trigger ───────────────────────────────────────────────────
-- Keeps updated_at current on every UPDATE without any application-level changes.

CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pcs_set_updated_at   ON pcs;
DROP TRIGGER IF EXISTS users_set_updated_at ON users;

CREATE TRIGGER pcs_set_updated_at
  BEFORE UPDATE ON pcs
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

-- ─── CICTE Lab Monitor — Supabase Schema ────────────────────────────────────
-- Run this once in your Supabase project's SQL Editor.
-- Dashboard → SQL Editor → New query → paste → Run

-- ─── Labs ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS labs (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  short         text NOT NULL,
  has_floor_plan boolean NOT NULL DEFAULT false
);

-- ─── PCs ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pcs (
  id                        text PRIMARY KEY,
  num                       integer NOT NULL,
  lab_id                    text NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  status                    text NOT NULL DEFAULT 'available'
                              CHECK (status IN ('available','occupied','maintenance')),
  condition                 text NOT NULL DEFAULT 'good'
                              CHECK (condition IN ('good','lagging','needs_repair','damaged')),
  password                  text NOT NULL DEFAULT '',
  last_password_change      text NOT NULL DEFAULT '',
  last_password_changed_by  text NOT NULL DEFAULT '',
  last_student              text NOT NULL DEFAULT '',
  last_used                 text NOT NULL DEFAULT '',
  router_ssid               text NOT NULL DEFAULT '',
  router_password           text NOT NULL DEFAULT '',
  specs                     jsonb NOT NULL DEFAULT '{}',
  repairs                   jsonb NOT NULL DEFAULT '[]',
  installed_apps            jsonb NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS pcs_lab_id_idx ON pcs (lab_id);
CREATE INDEX IF NOT EXISTS pcs_status_idx ON pcs (status);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- The server uses the SERVICE ROLE key which bypasses RLS entirely.
-- These policies block any direct anon/client access as a safety net.

ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcs  ENABLE ROW LEVEL SECURITY;

-- Deny all direct client access (server uses service key, so it is unaffected)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'labs' AND policyname = 'deny_all'
  ) THEN
    CREATE POLICY deny_all ON labs FOR ALL USING (false);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pcs' AND policyname = 'deny_all'
  ) THEN
    CREATE POLICY deny_all ON pcs FOR ALL USING (false);
  END IF;
END $$;

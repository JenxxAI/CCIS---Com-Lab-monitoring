-- ─── Users Table Migration ───────────────────────────────────────────────────
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).
-- Only needs to be run once, after the initial schema.sql.

-- Roles:
--   admin             → Dean / Program Head — total access including user management
--   staff             → Faculty / Lab Technician — total access including user management
--   student_volunteer → Can manage PCs and monitor labs — cannot manage users
--   student           → View only

CREATE TABLE IF NOT EXISTS users (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username      text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'student'
                  CHECK (role IN ('admin', 'staff', 'student_volunteer', 'student')),
  name          text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for fast username lookups during login
CREATE INDEX IF NOT EXISTS users_username_idx ON users (username);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Server uses the SERVICE ROLE key which bypasses RLS entirely.
-- These policies block any direct anon/client access as a safety net.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'deny_all'
  ) THEN
    CREATE POLICY deny_all ON users FOR ALL USING (false);
  END IF;
END $$;

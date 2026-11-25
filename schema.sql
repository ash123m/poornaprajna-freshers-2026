-- Run this once in your Neon or Supabase SQL Editor before deploying

CREATE TABLE IF NOT EXISTS freshers_checkins (
  id BIGSERIAL PRIMARY KEY,
  roll_no VARCHAR(32) NOT NULL UNIQUE,
  full_name VARCHAR(80) NOT NULL,
  first_name VARCHAR(40) NOT NULL,
  entry_source VARCHAR(24) NOT NULL DEFAULT 'qr_self',
  reverify_count INTEGER NOT NULL DEFAULT 0,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_freshers_checked_in_at
  ON freshers_checkins (checked_in_at DESC);

-- ============================================================
-- STEEP Analysis Platform — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- ── Thought Leadership ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS thought_leadership (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL DEFAULT '',
  title            TEXT NOT NULL DEFAULT 'Untitled',
  dek              TEXT NOT NULL DEFAULT '',
  content_markdown TEXT NOT NULL DEFAULT '',
  hero_image_url   TEXT NOT NULL DEFAULT '',
  geo_keywords     TEXT[] NOT NULL DEFAULT '{}',
  regions          TEXT[] NOT NULL DEFAULT '{}',
  instruments      TEXT[] NOT NULL DEFAULT '{}',
  companies        TEXT[] NOT NULL DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at     TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tl_status       ON thought_leadership(status);
CREATE INDEX IF NOT EXISTS idx_tl_published_at ON thought_leadership(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_tl_updated_at   ON thought_leadership(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tl_slug         ON thought_leadership(slug);

ALTER TABLE thought_leadership ENABLE ROW LEVEL SECURITY;

-- Public can read published posts; service role key bypasses RLS for admin ops
DROP POLICY IF EXISTS "public read published" ON thought_leadership;
CREATE POLICY "public read published" ON thought_leadership
  FOR SELECT USING (status = 'published');

-- ── Studio Updates ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS studio_updates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL DEFAULT 'Untitled',
  body         TEXT NOT NULL DEFAULT '',
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  status       TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  published_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_su_status ON studio_updates(status);
CREATE INDEX IF NOT EXISTS idx_su_date   ON studio_updates(date DESC);

ALTER TABLE studio_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read published" ON studio_updates;
CREATE POLICY "public read published" ON studio_updates
  FOR SELECT USING (status = 'published');

-- ── Innovator Illumination ────────────────────────────────────
CREATE TABLE IF NOT EXISTS innovator_illumination (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL DEFAULT '',
  title             TEXT NOT NULL DEFAULT 'Untitled',
  dek               TEXT NOT NULL DEFAULT '',
  logo_url          TEXT NOT NULL DEFAULT '',
  tech_segment      TEXT NOT NULL DEFAULT '',
  solution_overview TEXT NOT NULL DEFAULT '',
  content_markdown  TEXT NOT NULL DEFAULT '',
  hero_image_url    TEXT NOT NULL DEFAULT '',
  geo_keywords      TEXT[] NOT NULL DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at      TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ii_status       ON innovator_illumination(status);
CREATE INDEX IF NOT EXISTS idx_ii_published_at ON innovator_illumination(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_ii_slug         ON innovator_illumination(slug);

ALTER TABLE innovator_illumination ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read published" ON innovator_illumination;
CREATE POLICY "public read published" ON innovator_illumination
  FOR SELECT USING (status = 'published');

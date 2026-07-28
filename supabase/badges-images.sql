-- ─────────────────────────────────────────────────────────────
-- Glowe Play — per-state badge art
-- Run ONCE in Supabase → SQL Editor, after badges.sql. Safe to re-run.
--
-- Each badge can have three generated images:
--   image_new       → "Not started" (locked / muted)
--   image_progress  → "In progress"
--   image_url        → "Completed"  (already existed)
-- ─────────────────────────────────────────────────────────────
alter table public.badges add column if not exists image_new text;
alter table public.badges add column if not exists image_progress text;

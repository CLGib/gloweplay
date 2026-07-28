-- ─────────────────────────────────────────────────────────────
-- Glowe Play — book cover theme (run once, after schema.sql)
-- ─────────────────────────────────────────────────────────────
alter table public.children add column if not exists cover_theme text default 'starlight';
notify pgrst, 'reload schema';

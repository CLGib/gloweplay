-- ─────────────────────────────────────────────────────────────
-- Glowe Play — book cover theme (run once, after schema.sql)
-- ─────────────────────────────────────────────────────────────
alter table public.children add column if not exists cover_theme text default 'classic';
alter table public.children alter column cover_theme set default 'classic';
notify pgrst, 'reload schema';

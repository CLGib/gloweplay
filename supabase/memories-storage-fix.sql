-- ─────────────────────────────────────────────────────────────
-- Glowe Play — fix: memories storage RLS
-- Run in Supabase → SQL Editor. Idempotent.
-- Fixes "new row violates row-level security policy" on upload.
-- ─────────────────────────────────────────────────────────────

-- 1) Make sure the private bucket exists.
insert into storage.buckets (id, name, public)
values ('memories', 'memories', false)
on conflict (id) do nothing;

-- 2) (Re)create the storage policies. Uses split_part for the first path
--    segment (the child id in "<child_id>/<badge_id>/<file>").
drop policy if exists "memories read own"   on storage.objects;
drop policy if exists "memories insert own" on storage.objects;
drop policy if exists "memories update own" on storage.objects;
drop policy if exists "memories delete own" on storage.objects;

create policy "memories read own" on storage.objects
  for select to authenticated using (
    bucket_id = 'memories'
    and exists (select 1 from public.children c
                where c.id::text = split_part(name, '/', 1) and c.owner = auth.uid()));

create policy "memories insert own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'memories'
    and exists (select 1 from public.children c
                where c.id::text = split_part(name, '/', 1) and c.owner = auth.uid()));

create policy "memories update own" on storage.objects
  for update to authenticated using (
    bucket_id = 'memories'
    and exists (select 1 from public.children c
                where c.id::text = split_part(name, '/', 1) and c.owner = auth.uid()));

create policy "memories delete own" on storage.objects
  for delete to authenticated using (
    bucket_id = 'memories'
    and exists (select 1 from public.children c
                where c.id::text = split_part(name, '/', 1) and c.owner = auth.uid()));

-- 3) Verify (should return 4 rows):
-- select policyname from pg_policies
-- where schemaname='storage' and tablename='objects' and policyname like 'memories%';

-- ─────────────────────────────────────────────────────────────
-- Glowe Play — phone upload handoff (QR "upload from your phone")
-- Run ONCE in Supabase → SQL Editor, after schema.sql + memories.sql.
--
-- The desktop (signed-in owner) creates a short-lived session; its id is the
-- token embedded in the QR. The phone posts the photo to /api/phone-upload,
-- which validates the token with the service role and stores it. The phone
-- never reads/writes these tables directly.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.upload_sessions (
  id          uuid primary key default gen_random_uuid(),   -- the QR token
  owner       uuid not null references auth.users (id) on delete cascade,
  child_id    uuid not null references public.children (id) on delete cascade,
  badge_id    text not null,
  kind        text not null default 'photo' check (kind in ('photo','video','voice','drawing','text')),
  status      text not null default 'pending' check (status in ('pending','done','expired')),
  result_path text,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '15 minutes')
);
create index if not exists upload_sessions_owner_idx on public.upload_sessions (owner);

alter table public.upload_sessions enable row level security;

drop policy if exists upload_sessions_insert on public.upload_sessions;
drop policy if exists upload_sessions_select on public.upload_sessions;

-- Owner may create a session for a child they own, and read their own sessions
-- (to poll for completion). Updates happen server-side (service role).
create policy upload_sessions_insert on public.upload_sessions for insert with check (
  owner = auth.uid()
  and exists (select 1 from public.children c where c.id = child_id and c.owner = auth.uid()));
create policy upload_sessions_select on public.upload_sessions for select using (owner = auth.uid());

notify pgrst, 'reload schema';

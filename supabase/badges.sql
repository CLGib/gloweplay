-- ─────────────────────────────────────────────────────────────
-- Glowe Play — admin roles + badge catalog
-- Run this ONCE in Supabase → SQL Editor, AFTER schema.sql.
-- Safe to re-run.
-- ─────────────────────────────────────────────────────────────

-- ── Admins ───────────────────────────────────────────────────
create table if not exists public.admins (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.admins enable row level security;

-- A user may read their own admin row (so the app can ask "am I an admin?").
drop policy if exists admins_select_self on public.admins;
create policy admins_select_self on public.admins
  for select using (auth.uid() = user_id);
-- Inserts/updates/deletes are intentionally NOT exposed to the client.
-- Manage admins with the SQL at the bottom of this file.

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- ── Badge catalog ────────────────────────────────────────────
create table if not exists public.badges (
  id            text primary key,                 -- stable slug, e.g. 'fort-builder'
  line1         text not null,                    -- top title line, e.g. 'Campfire'
  line2         text not null default '',         -- bottom title line, e.g. 'Explorer'
  type          text not null default 'adventure'
                 check (type in ('milestone','adventure','tradition')),
  icon_emoji    text not null default '⭐',        -- fallback icon when no image
  image_url     text,                             -- generated badge art (Supabase Storage)
  description   text not null default '',         -- caption on the badge / book page
  verb          text not null default 'Completed',-- ribbon verb (Captured/Completed/Answered)
  how_to_earn   jsonb not null default '[]'::jsonb,-- ["Do it","Snap a photo","Earn"]
  media         jsonb not null default '["photo"]'::jsonb, -- photo|video|voice|drawing|text
  template      text not null default 'portrait'  -- book page layout preset
                 check (template in ('photo-spotlight','quote','portrait','collage')),
  accent        text not null default 'auto',     -- 'auto' (by type) or a hex
  scene_prompt  text not null default '',         -- extra art direction for the generator
  sort_order    int  not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists badges_active_idx on public.badges (is_active, sort_order);

alter table public.badges enable row level security;

-- Everyone signed in can read active badges (families + kids see the catalog).
drop policy if exists badges_select on public.badges;
create policy badges_select on public.badges
  for select using (is_active or public.is_admin());

-- Only admins can create/edit/delete badges.
drop policy if exists badges_insert on public.badges;
drop policy if exists badges_update on public.badges;
drop policy if exists badges_delete on public.badges;
create policy badges_insert on public.badges for insert with check (public.is_admin());
create policy badges_update on public.badges for update using (public.is_admin()) with check (public.is_admin());
create policy badges_delete on public.badges for delete using (public.is_admin());

-- ── Seed the current 12 badges ───────────────────────────────
insert into public.badges (id, line1, line2, type, icon_emoji, description, verb, how_to_earn, media, template, sort_order) values
  ('first-tooth','First','Tooth','milestone','🦷','The day a wobbly tooth finally comes out.','Captured','["Wait for the big wobble","Snap a photo of the gap","Earn your badge"]','["photo"]','portrait',10),
  ('first-ride','First','Ride','milestone','🚲','Two wheels, no training wheels — you did it!','Captured','["Take the training wheels off","Film your first real ride","Earn your badge"]','["photo","video"]','photo-spotlight',20),
  ('first-day','First','Day','milestone','🎒','The first morning of a brand-new school year.','Captured','["Pack your backpack","Take a first-day photo","Earn your badge"]','["photo"]','portrait',30),
  ('grew-up','Grew','Up','milestone','🧸','A little moment that shows how big you got.','Captured','["Notice something new you can do","Add a photo or note","Earn your badge"]','["photo","text"]','portrait',40),
  ('rainbow','Rainbow','Hunter','adventure','🌈','Find a rainbow and chase the colors.','Completed','["Wait for sun after the rain","Photograph the rainbow","Earn your badge"]','["photo"]','photo-spotlight',50),
  ('baker','Family','Baker','adventure','🍪','Bake something together — flour on the nose required.','Completed','["Pick a recipe together","Bake it (and taste it!)","Earn your badge"]','["photo"]','collage',60),
  ('fort','Fort','Builder','adventure','⛺','Build a blanket fort and camp out inside.','Completed','["Gather blankets & pillows","Build the coziest fort","Earn your badge"]','["photo","video"]','photo-spotlight',70),
  ('stargazer','Star','Gazer','adventure','🌠','Look for constellations on a clear, dark night.','Completed','["Wait for a clear night","Spot a constellation","Earn your badge"]','["photo","voice"]','quote',80),
  ('kindness','Kindness','Hero','adventure','❤️','Do something kind, just because.','Completed','["Spot someone who needs a hand","Do a kind thing","Earn your badge"]','["photo","text"]','quote',90),
  ('birthday','Birthday','Interview','tradition','🎂','The same fun questions, asked every birthday.','Answered','["Sit down on your birthday","Answer the questions","Earn your badge"]','["voice","text"]','quote',100),
  ('year-review','Year','Review','tradition','📅','Look back at everything this year held.','Answered','["Wait for the end of your year","Answer the look-back","Earn your badge"]','["text"]','quote',110),
  ('story','Story','Time','tradition','🎙️','Tell a story in your own words and your own voice.','Answered','["Think up a story","Record it in your voice","Earn your badge"]','["voice"]','quote',120)
on conflict (id) do nothing;

-- ── Storage bucket for generated badge art ───────────────────
-- Public read so the app can show badge images; writes happen server-side
-- (the Edge Function uses the service role, so no client write policy needed).
insert into storage.buckets (id, name, public)
values ('badge-art', 'badge-art', true)
on conflict (id) do nothing;

-- ── Make yourself an admin ───────────────────────────────────
-- Replace the email, then run just this statement:
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com'
--   on conflict do nothing;

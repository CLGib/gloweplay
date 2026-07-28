-- ─────────────────────────────────────────────────────────────
-- Glowe Play — book-spread badges & page templates
-- Run ONCE in Supabase → SQL Editor, AFTER badges.sql. Safe to re-run.
--
-- Each of these badges maps to a two-page layout in the child's book
-- (see child.html). Earning the badge adds its spread to the book.
-- ─────────────────────────────────────────────────────────────

-- Templates now drive book layouts; allow any value so they can evolve.
alter table public.badges drop constraint if exists badges_template_check;

insert into public.badges (id, line1, line2, type, icon_emoji, description, verb, how_to_earn, media, template, sort_order) values
  ('big-dreams','Big','Dreams','adventure','🏡','You imagined big, built a little, and dreamt even bigger.','Completed','["Dream up something big together","Add a photo","Earn your badge"]','["photo","text"]','chapter',5),
  ('our-conversation','Our','Conversation','tradition','💬','A little interview about your big ideas.','Answered','["Ask the month''s question","Record the answer","Earn your badge"]','["text","voice"]','interview',15),
  ('masterpiece','Your','Masterpiece','milestone','🎨','A drawing worth framing.','Captured','["Make a drawing","Photograph it","Add a love note"]','["drawing","text"]','masterpiece',25),
  ('funny-things','Funny','Things','tradition','😄','The funniest things you said this year.','Answered','["Catch a funny quote","Write it down with the month","Earn your badge"]','["text"]','quotes',205),
  ('favorites','Your','Favorites','tradition','⭐','How your favorites changed from the start of the year to the end.','Answered','["List your favorites","Compare start vs end of year","Earn your badge"]','["text"]','favorites',215),
  ('draw-yourself','Draw','Yourself','tradition','✏️','A self-portrait, your signature, and your voice.','Answered','["Draw a self-portrait","Sign your name","Record your voice"]','["drawing","voice"]','signature',225),
  ('letter-future','Letter to','Future You','tradition','💌','A note to the person you will become.','Answered','["Write a letter to future you","Add your voice","Earn your badge"]','["text","voice"]','letter',999)
on conflict (id) do nothing;

-- Point the birthday badge at the birthday layout. Every other seeded badge
-- (adventures, milestones) renders as an "Adventure Earned" spread by default.
update public.badges set template = 'birthday' where id = 'birthday';

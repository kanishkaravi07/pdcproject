-- Kealvi Database Schema
-- Run this script in the Supabase SQL Editor.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── 1. PROFILES (Linked to Supabase Auth) ──────────────────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text,
  avatar_url   text,
  reputation   integer default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Trigger to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url, reputation)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    0
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 2. QUESTIONS ────────────────────────────────────────────────────────────
create table if not exists questions (
  id               uuid primary key default gen_random_uuid(),
  body             text not null,
  author           text,
  user_id          uuid references profiles(id) on delete set null,
  last_activity_at timestamptz default now(),
  created_at       timestamptz default now()
);

-- Add missing columns if questions table pre-existed
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='questions' and column_name='user_id') then
    alter table questions add column user_id uuid references profiles(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='questions' and column_name='last_activity_at') then
    alter table questions add column last_activity_at timestamptz default now();
  end if;
end $$;

create index if not exists questions_fts_idx on questions using gin (to_tsvector('english', body));
create index if not exists questions_last_activity_idx on questions (last_activity_at desc);

-- ── 3. QUESTION VOTES ────────────────────────────────────────────────────────
create table if not exists votes (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references questions(id) on delete cascade,
  voter_id     text not null,
  user_id      uuid references profiles(id) on delete cascade,
  created_at   timestamptz default now(),
  unique (question_id, voter_id)
);

create index if not exists votes_question_id_idx on votes (question_id);

-- ── 4. ANSWERS ───────────────────────────────────────────────────────────────
create table if not exists answers (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references questions(id) on delete cascade,
  user_id      uuid references profiles(id) on delete set null,
  author       text,
  content      text not null,
  is_accepted  boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists answers_question_id_idx on answers (question_id);

-- Enforce only one accepted answer per question
create unique index if not exists unique_accepted_answer_per_question 
  on answers (question_id) 
  where is_accepted = true;

-- ── 5. ANSWER VOTES ──────────────────────────────────────────────────────────
create table if not exists answer_votes (
  id           uuid primary key default gen_random_uuid(),
  answer_id    uuid not null references answers(id) on delete cascade,
  voter_id     text not null,
  user_id      uuid references profiles(id) on delete cascade,
  created_at   timestamptz default now(),
  unique (answer_id, voter_id)
);

create index if not exists answer_votes_answer_id_idx on answer_votes (answer_id);

-- ── 6. COMMENTS ──────────────────────────────────────────────────────────────
create table if not exists comments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete set null,
  author       text,
  question_id  uuid references questions(id) on delete cascade,
  answer_id    uuid references answers(id) on delete cascade,
  content      text not null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  constraint comment_target_check check (
    (question_id is not null and answer_id is null) or
    (question_id is null and answer_id is not null)
  )
);

create index if not exists comments_question_id_idx on comments (question_id);
create index if not exists comments_answer_id_idx on comments (answer_id);

-- ── 7. POLLS ─────────────────────────────────────────────────────────────────
create table if not exists polls (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete set null,
  question    text not null,
  author      text,
  expires_at  timestamptz,
  created_at  timestamptz default now()
);

-- Ensure missing columns are added if polls table pre-existed
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='polls' and column_name='user_id') then
    alter table polls add column user_id uuid references profiles(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='polls' and column_name='author') then
    alter table polls add column author text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='polls' and column_name='expires_at') then
    alter table polls add column expires_at timestamptz;
  end if;
end $$;

create table if not exists poll_options (
  id          uuid primary key default gen_random_uuid(),
  poll_id     uuid not null references polls(id) on delete cascade,
  option_text text not null
);

create index if not exists poll_options_poll_id_idx on poll_options (poll_id);

create table if not exists poll_votes (
  id          uuid primary key default gen_random_uuid(),
  poll_id     uuid not null references polls(id) on delete cascade,
  option_id   uuid not null references poll_options(id) on delete cascade,
  voter_id    text not null,
  user_id     uuid references profiles(id) on delete set null,
  created_at  timestamptz default now(),
  unique (poll_id, voter_id)
);

create index if not exists poll_votes_poll_id_idx on poll_votes (poll_id);

-- ── 8. REPUTATION RECALCULATION & TRIGGER FUNCTION ────────────────────────────
create or replace function update_user_reputation(target_user_id uuid)
returns void as $$
declare
  q_points int := 0;
  q_vote_points int := 0;
  a_points int := 0;
  a_vote_points int := 0;
  accepted_points int := 0;
  total int := 0;
begin
  if target_user_id is null then return; end if;

  select count(*) * 5 into q_points from questions where user_id = target_user_id;

  select count(*) * 10 into q_vote_points 
  from votes v 
  join questions q on v.question_id = q.id 
  where q.user_id = target_user_id;

  select count(*) * 5 into a_points from answers where user_id = target_user_id;

  select count(*) * 10 into a_vote_points 
  from answer_votes av 
  join answers a on av.answer_id = a.id 
  where a.user_id = target_user_id;

  select count(*) * 25 into accepted_points 
  from answers 
  where user_id = target_user_id and is_accepted = true;

  total := q_points + q_vote_points + a_points + a_vote_points + accepted_points;

  update profiles set reputation = total, updated_at = now() where id = target_user_id;
end;
$$ language plpgsql security definer;

-- Trigger function for question activity
create or replace function update_question_activity()
returns trigger as $$
begin
  if TG_TABLE_NAME = 'answers' then
    update questions set last_activity_at = now() where id = new.question_id;
  elsif TG_TABLE_NAME = 'comments' then
    if new.question_id is not null then
      update questions set last_activity_at = now() where id = new.question_id;
    elsif new.answer_id is not null then
      update questions set last_activity_at = now() 
      where id = (select question_id from answers where id = new.answer_id);
    end if;
  elsif TG_TABLE_NAME = 'votes' then
    update questions set last_activity_at = now() where id = new.question_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_answer_activity on answers;
create trigger on_answer_activity after insert on answers for each row execute procedure update_question_activity();

drop trigger if exists on_comment_activity on comments;
create trigger on_comment_activity after insert on comments for each row execute procedure update_question_activity();

drop trigger if exists on_vote_activity on votes;
create trigger on_vote_activity after insert on votes for each row execute procedure update_question_activity();

-- ── 9. ROW LEVEL SECURITY (RLS) POLICIES ──────────────────────────────────────
alter table profiles enable row level security;
alter table questions enable row level security;
alter table votes enable row level security;
alter table answers enable row level security;
alter table answer_votes enable row level security;
alter table comments enable row level security;
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public profiles read" on profiles;
drop policy if exists "Public questions read" on questions;
drop policy if exists "Public votes read" on votes;
drop policy if exists "Public answers read" on answers;
drop policy if exists "Public answer_votes read" on answer_votes;
drop policy if exists "Public comments read" on comments;
drop policy if exists "Public polls read" on polls;
drop policy if exists "Public poll_options read" on poll_options;
drop policy if exists "Public poll_votes read" on poll_votes;

drop policy if exists "Public/Auth insert questions" on questions;
drop policy if exists "Public/Auth insert votes" on votes;
drop policy if exists "Public/Auth insert answers" on answers;
drop policy if exists "Public/Auth insert answer_votes" on answer_votes;
drop policy if exists "Public/Auth insert comments" on comments;
drop policy if exists "Public/Auth insert polls" on polls;
drop policy if exists "Public/Auth insert poll_options" on poll_options;
drop policy if exists "Public/Auth insert poll_votes" on poll_votes;

drop policy if exists "Owner update profile" on profiles;
drop policy if exists "Owner update answers" on answers;
drop policy if exists "Owner delete answers" on answers;
drop policy if exists "Owner update comments" on comments;
drop policy if exists "Owner delete comments" on comments;

-- Create Policies
create policy "Public profiles read" on profiles for select using (true);
create policy "Public questions read" on questions for select using (true);
create policy "Public votes read" on votes for select using (true);
create policy "Public answers read" on answers for select using (true);
create policy "Public answer_votes read" on answer_votes for select using (true);
create policy "Public comments read" on comments for select using (true);
create policy "Public polls read" on polls for select using (true);
create policy "Public poll_options read" on poll_options for select using (true);
create policy "Public poll_votes read" on poll_votes for select using (true);

create policy "Public/Auth insert questions" on questions for insert with check (true);
create policy "Public/Auth insert votes" on votes for insert with check (true);
create policy "Public/Auth insert answers" on answers for insert with check (true);
create policy "Public/Auth insert answer_votes" on answer_votes for insert with check (true);
create policy "Public/Auth insert comments" on comments for insert with check (true);
create policy "Public/Auth insert polls" on polls for insert with check (true);
create policy "Public/Auth insert poll_options" on poll_options for insert with check (true);
create policy "Public/Auth insert poll_votes" on poll_votes for insert with check (true);

create policy "Owner update profile" on profiles for update using (auth.uid() = id);
create policy "Owner update answers" on answers for update using (auth.uid() = user_id or exists (
  select 1 from questions q where q.id = answers.question_id and q.user_id = auth.uid()
));
create policy "Owner delete answers" on answers for delete using (auth.uid() = user_id);
create policy "Owner update comments" on comments for update using (auth.uid() = user_id);
create policy "Owner delete comments" on comments for delete using (auth.uid() = user_id);

-- ── 10. SEED DATA ────────────────────────────────────────────────────────────
insert into questions (body, author, created_at, last_activity_at)
select q.body, q.author, now() - (q.n || ' minutes')::interval, now() - (q.n || ' minutes')::interval
from (
  values
    (1,  'How do I deploy to Vercel?', 'Priya'),
    (2,  'What is the difference between server and client components?', 'Marcus'),
    (3,  'When should I add a database index?', 'Aisha'),
    (4,  'How does Postgres full-text search work?', 'Diego'),
    (5,  'Why did my in-memory data vanish on restart?', 'Lena'),
    (6,  'Should I store a vote count or count vote rows?', 'Sam'),
    (7,  'What is a unique constraint good for?', 'Priya'),
    (8,  'How do I prevent double voting?', 'Noah'),
    (9,  'What is the difference between SSR and hydration?', 'Aisha'),
    (10, 'How does optimistic UI actually work?', 'Marcus'),
    (11, 'When do I really need pagination?', 'Ravi'),
    (12, 'Offset vs cursor pagination — which one?', 'Lena'),
    (13, 'How do I debounce a search input?', 'Diego'),
    (14, 'Why must secrets stay on the server?', 'Sam'),
    (15, 'What is row-level security in Supabase?', 'Noah'),
    (16, 'How does connection pooling help on Vercel?', 'Priya'),
    (17, 'What is a GIN index and when do I use it?', 'Ravi'),
    (18, 'How do foreign keys protect my data?', 'Aisha'),
    (19, 'When should I move counts into caching?', 'Marcus'),
    (20, 'How do I run a database migration safely?', 'Lena'),
    (21, 'What does on delete cascade actually do?', 'Diego'),
    (22, 'How do I seed test data quickly?', 'Sam'),
    (23, 'Why is my Vercel function cold starting?', 'Noah'),
    (24, 'How do I scale reads with replicas?', 'Ravi'),
    (25, 'What is the best way to add auth later?', 'Priya')
) as q(n, body, author)
where not exists (select 1 from questions);

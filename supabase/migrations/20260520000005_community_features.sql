-- Community tips
create table if not exists community_tips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  match text not null,
  prediction text not null,
  reasoning text not null check (length(reasoning) >= 10),
  odds numeric,
  likes int default 0,
  dislikes int default 0,
  result text, -- 'win' | 'loss' | 'void' | null
  created_at timestamptz default now()
);
alter table community_tips enable row level security;
create policy "tips_read_all" on community_tips for select using (true);
create policy "tips_insert_own" on community_tips for insert with check (auth.uid() = user_id);
create policy "tips_update_own" on community_tips for update using (auth.uid() = user_id);

-- Tip votes
create table if not exists tip_votes (
  tip_id uuid references community_tips(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  vote text check (vote in ('like', 'dislike')),
  primary key (tip_id, user_id)
);
alter table tip_votes enable row level security;
create policy "votes_all_own" on tip_votes for all using (auth.uid() = user_id);

-- User roles (for admin dashboard)
create table if not exists user_roles (
  user_id uuid references profiles(id) on delete cascade,
  role text check (role in ('admin', 'moderator', 'tipster')),
  primary key (user_id, role)
);
alter table user_roles enable row level security;
create policy "roles_read_own" on user_roles for select using (auth.uid() = user_id);
create policy "roles_admin_write" on user_roles for all using (auth.role() = 'service_role');

-- Indexes
create index if not exists idx_tips_user on community_tips(user_id);
create index if not exists idx_tips_likes on community_tips(likes desc);
create index if not exists idx_tips_created on community_tips(created_at desc);

-- Efficient streak calculation as a materialized view
create or replace view user_streak_stats as
with ranked as (
  select
    user_id,
    is_correct,
    match_date,
    row_number() over (partition by user_id order by match_date desc) as rn
  from predictions_history
  where is_correct is not null
),
-- Current streak: consecutive correct from most recent
current_streak as (
  select
    user_id,
    count(*) as current_streak
  from (
    select user_id, is_correct, rn,
      rn - row_number() over (partition by user_id, is_correct order by rn) as grp
    from ranked
  ) t
  where is_correct = true and grp = 0
  group by user_id
),
-- Longest streak ever
all_streaks as (
  select
    user_id,
    count(*) as streak_length
  from (
    select user_id, is_correct,
      rn - row_number() over (partition by user_id, is_correct order by rn) as grp
    from ranked
  ) t
  where is_correct = true
  group by user_id, grp
)
select
  p.user_id,
  coalesce(cs.current_streak, 0) as current_streak,
  coalesce(max(a.streak_length), 0) as longest_streak,
  count(case when p.is_correct = true then 1 end) as total_correct,
  count(*) as total_predictions
from predictions_history p
left join current_streak cs on cs.user_id = p.user_id
left join all_streaks a on a.user_id = p.user_id
where p.is_correct is not null
group by p.user_id, cs.current_streak;

-- RPC to get streak for a user (used by useStreakData hook)
create or replace function get_user_streak(uid uuid)
returns json language sql security definer as $$
  select row_to_json(s) from user_streak_stats s where user_id = uid;
$$;

-- Push notification subscriptions table
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null unique,
  endpoint text not null,
  keys jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table push_subscriptions enable row level security;
create policy "push_own" on push_subscriptions for all using (auth.uid() = user_id);

-- Streak calculation as a DB view (O(1) for client)
create or replace view user_prediction_streaks as
with ranked as (
  select
    up.user_id,
    p.match_date,
    case when p.result = p.predicted_outcome then 1 else 0 end as correct,
    row_number() over (partition by up.user_id order by p.match_date desc) as rn
  from user_predictions up
  join predictions p on p.id = up.prediction_id
  where p.status = 'resolved'
),
streaks as (
  select
    user_id,
    sum(correct) as total_correct,
    count(*) as total_predictions,
    -- Current streak: consecutive correct from most recent
    sum(case when rn <= (select min(rn)-1 from ranked r2 where r2.user_id = ranked.user_id and r2.correct = 0) then correct else 0 end) as current_streak
  from ranked
  group by user_id
)
select
  user_id,
  total_correct,
  total_predictions,
  case when total_predictions > 0 then round((total_correct::numeric / total_predictions) * 100, 1) else 0 end as accuracy_pct,
  coalesce(current_streak, 0) as current_streak
from streaks;

-- Push subscriptions table
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

-- Spin wheel entries table (if not exists)
create table if not exists spin_wheel_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  prize_type text not null,
  prize_amount int default 0,
  spun_at timestamptz default now()
);
alter table spin_wheel_entries enable row level security;
create policy "spin_own" on spin_wheel_entries for all using (auth.uid() = user_id);

-- Index for daily spin check
create index if not exists idx_spin_entries_user_date on spin_wheel_entries(user_id, spun_at desc);

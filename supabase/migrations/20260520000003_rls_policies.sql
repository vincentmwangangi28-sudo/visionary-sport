-- ─── Predictions ────────────────────────────────────────────────
alter table predictions enable row level security;

-- Anyone can read predictions
create policy "predictions_read_all"
  on predictions for select using (true);

-- Only service role can insert/update predictions
create policy "predictions_service_write"
  on predictions for all
  using (auth.role() = 'service_role');

-- ─── Transactions ───────────────────────────────────────────────
alter table transactions enable row level security;

-- Users can only read their own transactions
create policy "transactions_read_own"
  on transactions for select
  using (auth.uid() = user_id);

-- Only service role can write transactions (prevents client-side fraud)
create policy "transactions_service_write"
  on transactions for all
  using (auth.role() = 'service_role');

-- ─── Subscriptions ──────────────────────────────────────────────
alter table subscriptions enable row level security;

-- Users can read their own subscriptions
create policy "subscriptions_read_own"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Only service role can create/update subscriptions (no client-side plan activation)
create policy "subscriptions_service_write"
  on subscriptions for all
  using (auth.role() = 'service_role');

-- ─── Profiles ───────────────────────────────────────────────────
alter table profiles enable row level security;

create policy "profiles_read_all"
  on profiles for select using (true);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id);

-- ─── Referrals ──────────────────────────────────────────────────
alter table referrals enable row level security;

create policy "referrals_read_own"
  on referrals for select
  using (auth.uid() = referrer_id or auth.uid() = referred_id);

create policy "referrals_service_write"
  on referrals for all
  using (auth.role() = 'service_role');

-- ─── Referral codes ─────────────────────────────────────────────
alter table referral_codes enable row level security;

create policy "referral_codes_read_all"
  on referral_codes for select using (true);

create policy "referral_codes_own_write"
  on referral_codes for insert
  with check (auth.uid() = user_id);

-- ─── Notifications ──────────────────────────────────────────────
alter table notifications enable row level security;

create policy "notifications_read_own"
  on notifications for select
  using (auth.uid() = user_id);

create policy "notifications_update_own"
  on notifications for update
  using (auth.uid() = user_id);

create policy "notifications_service_write"
  on notifications for insert
  using (auth.role() = 'service_role');

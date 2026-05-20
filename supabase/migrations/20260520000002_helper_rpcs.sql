-- Add coins to a user safely (avoids race conditions)
create or replace function add_coins(user_id_val uuid, amount_val int)
returns void language plpgsql security definer as $$
begin
  update profiles set coins = coins + amount_val where id = user_id_val;
end;
$$;

-- Increment referral code uses
create or replace function increment_referral_uses(code_val text)
returns void language plpgsql security definer as $$
begin
  update referral_codes set uses_count = coalesce(uses_count, 0) + 1 where code = code_val;
end;
$$;

-- Index for faster transaction rate-limit queries
create index if not exists idx_transactions_user_created
  on transactions(user_id, created_at desc);

-- Index for subscription expiry queries
create index if not exists idx_subscriptions_expiry
  on subscriptions(status, expires_at)
  where status = 'active';

-- Harden Auth/admin authorization and protect user balances/profile identity fields.
-- Applied to production Supabase project bhgjlhgevyggkhyytulv.

create or replace function public.protect_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    if new.id <> old.id
      or new.email <> old.email
      or new.coins <> old.coins
      or new.created_at <> old.created_at then
      raise exception 'Protected profile fields can only be changed by an administrator';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_sensitive_fields on public.profiles;
create trigger protect_profile_sensitive_fields
before update on public.profiles
for each row execute function public.protect_profile_sensitive_fields();

revoke execute on function public.protect_profile_sensitive_fields() from public, anon, authenticated;
grant execute on function public.protect_profile_sensitive_fields() to postgres;

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all
on public.profiles
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists transactions_admin_all on public.transactions;
create policy transactions_admin_all
on public.transactions
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists subscriptions_admin_all on public.subscriptions;
create policy subscriptions_admin_all
on public.subscriptions
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists user_roles_admin_all on public.user_roles;
create policy user_roles_admin_all
on public.user_roles
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

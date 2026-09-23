-- Nova auth schema for Supabase
-- Run this entire file in Supabase Dashboard -> SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  name_normalized text generated always as (lower(trim(name))) stored,
  country text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_name_normalized_key
  on public.profiles(name_normalized);

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, country, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'country', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Used only by the login-by-name Edge Function.
-- It is intentionally not granted to anon/authenticated users.
create or replace function public.get_email_for_name(p_name text)
returns text
language sql
security definer set search_path = public
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.name_normalized = lower(trim(p_name))
  limit 1;
$$;

revoke all on function public.get_email_for_name(text) from public, anon, authenticated;
grant execute on function public.get_email_for_name(text) to service_role;

-- Client-side availability check for friendly registration feedback.
create or replace function public.is_name_available(p_name text)
returns boolean
language sql
security invoker
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles
    where name_normalized = lower(trim(p_name))
  );
$$;

grant execute on function public.is_name_available(text) to anon, authenticated;

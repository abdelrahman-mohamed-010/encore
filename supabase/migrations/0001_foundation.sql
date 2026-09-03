-- ============================================================================
-- Tazkarti :: 0001 foundation
-- Extensions, enums, private config, shared helper functions, profiles.
-- ============================================================================

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "citext" with schema extensions;

-- ---------------------------------------------------------------------------
-- Private schema: server-only configuration. Never exposed through PostgREST.
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table if not exists private.app_config (
  key   text primary key,
  value text not null
);
revoke all on private.app_config from anon, authenticated;

-- Verifies a caller holds the shared server secret. Used to gate the RPCs that
-- only our trusted server routes (never the browser) are allowed to invoke.
create or replace function private.verify_server_secret(p_secret text)
returns void
language plpgsql
security definer
set search_path = private, pg_catalog
as $$
declare
  v_expected text;
begin
  select value into v_expected from private.app_config where key = 'server_secret';
  if v_expected is null then
    raise exception 'server secret is not configured' using errcode = 'P0001';
  end if;
  if p_secret is null or p_secret <> v_expected then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role          as enum ('attendee', 'organizer', 'admin');
create type public.org_member_role    as enum ('owner', 'admin', 'staff', 'scanner');
create type public.event_status       as enum ('draft', 'pending_review', 'published', 'paused', 'cancelled', 'completed');
create type public.event_visibility   as enum ('public', 'unlisted', 'private');
create type public.seating_type       as enum ('general_admission', 'reserved_seating');
create type public.seat_status        as enum ('available', 'held', 'sold', 'blocked');
create type public.reservation_status as enum ('active', 'converted', 'expired', 'released');
create type public.order_status       as enum ('pending', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded');
create type public.payment_status     as enum ('requires_payment', 'processing', 'succeeded', 'failed', 'refunded');
create type public.payment_provider   as enum ('stripe', 'sandbox');
create type public.ticket_status      as enum ('valid', 'used', 'void', 'refunded');
create type public.scan_result        as enum ('valid', 'already_used', 'void', 'wrong_event', 'not_found');
create type public.discount_type      as enum ('percentage', 'fixed');
create type public.refund_status      as enum ('pending', 'succeeded', 'failed');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type public.notification_type  as enum ('order_confirmed', 'order_refunded', 'event_updated', 'event_cancelled', 'event_reminder', 'payout', 'system');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Slugify: lowercase, strip accents-free non-alphanumerics, collapse dashes.
create or replace function public.slugify(p_input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(lower(coalesce(p_input, '')), '[^a-z0-9]+', '-', 'g'),
      '-{2,}', '-', 'g'
    )
  );
$$;

-- Short, unambiguous human-facing codes (no 0/O/1/I) for orders and tickets.
create or replace function public.generate_code(p_length int default 10)
returns text
language plpgsql
volatile
as $$
declare
  v_alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_out text := '';
  i int;
begin
  for i in 1..p_length loop
    v_out := v_out || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
  end loop;
  return v_out;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text,
  avatar_url   text,
  phone        text,
  bio          text,
  role         public.user_role not null default 'attendee',
  is_banned    boolean not null default false,
  locale       text not null default 'en',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);
create index profiles_email_idx on public.profiles(lower(email));

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Mirror new auth users into profiles. Runs as definer so signup never fails
-- on RLS. Metadata keys match what the sign-up form sends.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profile email in sync when the user changes it in auth.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = coalesce(new.email, '') where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- Authorization helpers. STABLE + definer so RLS policies can call them
-- without recursing into the policies of the tables they read.
-- ---------------------------------------------------------------------------
create or replace function public.current_role_name()
returns public.user_role
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and not is_banned
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and not is_banned
  );
$$;

grant execute on function public.current_role_name() to authenticated;
grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.is_active_user() to authenticated, anon;
grant execute on function public.slugify(text) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Platform settings (single row)
-- ---------------------------------------------------------------------------
create table public.platform_settings (
  id                       boolean primary key default true check (id),
  platform_name            text not null default 'Tazkarti',
  support_email            text not null default 'support@tazkarti.app',
  default_currency         text not null default 'USD',
  platform_fee_percent     numeric(5,2) not null default 5.00 check (platform_fee_percent >= 0 and platform_fee_percent <= 100),
  platform_fee_fixed_cents integer not null default 99 check (platform_fee_fixed_cents >= 0),
  require_event_approval    boolean not null default true,
  hold_duration_minutes    integer not null default 10 check (hold_duration_minutes between 1 and 120),
  updated_at               timestamptz not null default now()
);

insert into public.platform_settings (id) values (true) on conflict do nothing;

create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

alter table public.platform_settings enable row level security;

create policy "platform settings are readable by everyone"
  on public.platform_settings for select
  using (true);

create policy "only admins change platform settings"
  on public.platform_settings for update
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Profiles RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "admins update any profile"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- Role and ban flag are privileged columns: block self-escalation even though
-- the row itself is user-updatable.
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'role can only be changed by an administrator' using errcode = '42501';
  end if;
  if new.is_banned is distinct from old.is_banned then
    raise exception 'ban status can only be changed by an administrator' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_privileged
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();

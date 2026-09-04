-- 0015_profile_privacy_and_public_hosts
--
-- SECURITY FIX.
--
-- `profiles` carried "profiles are publicly readable ... using (true)" from
-- 0001. Because the table also holds `email` and `phone`, and the anon key is
-- public by design, anyone could read every user's email address straight off
-- the REST endpoint:
--
--   set role anon; select count(email) from public.profiles;  -> 19
--
-- Row-level security cannot restrict *columns*, so the row policy is narrowed
-- to the people who legitimately need contact details, and everything the
-- public genuinely needs is served by a curated view instead.

-- ---------------------------------------------------------------------------
-- 1. Narrow the row policy.
--
--    Kept working: a user reading themselves (auth, settings, checkout),
--    admins (the admin console), and co-members of an organizer (the team
--    page, which shows teammates' emails on purpose).
-- ---------------------------------------------------------------------------
drop policy if exists "profiles are publicly readable" on public.profiles;

create policy "users read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "admins read every profile"
  on public.profiles for select
  using (public.is_admin());

create policy "team mates read each other"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.organizer_members mine
      join public.organizer_members theirs on theirs.organizer_id = mine.organizer_id
      where mine.user_id = auth.uid()
        and theirs.user_id = public.profiles.id
    )
  );

-- ---------------------------------------------------------------------------
-- 2. The public projection.
--
--    Deliberately NOT security_invoker: the whole point is to expose a chosen
--    subset of columns to callers who can no longer read the base table. It is
--    the column list that provides the safety, and it contains nothing
--    private — no email, no phone, no ban flag.
-- ---------------------------------------------------------------------------
create or replace view public.public_profiles
with (security_barrier = true) as
  select
    p.id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.created_at
  from public.profiles p
  where not p.is_banned;

comment on view public.public_profiles is
  'Safe, public subset of profiles. Never add email, phone or role here: the base table is no longer world-readable precisely because those columns exist on it.';

revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. host_profile — the public "who is this person" page.
--
--    Counts are computed here rather than in the client so that the numbers do
--    not require reading orders or tickets, which stay locked down.
-- ---------------------------------------------------------------------------
create or replace function public.host_profile(p_id uuid)
returns table (
  id            uuid,
  full_name     text,
  avatar_url    text,
  bio           text,
  created_at    timestamptz,
  hosted_count  integer,
  attended_count integer,
  organizers    jsonb
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select
    p.id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.created_at,
    (
      select count(*)::int
      from public.events e
      join public.organizer_members m on m.organizer_id = e.organizer_id
      where m.user_id = p.id
        and m.role in ('owner', 'admin')
        and e.status = 'published'
        and e.visibility = 'public'
    ) as hosted_count,
    (
      -- Distinct events, not tickets: buying four seats is one event attended.
      select count(distinct t.event_id)::int
      from public.tickets t
      where t.owner_user_id = p.id
        and t.status in ('valid', 'used')
    ) as attended_count,
    coalesce(
      (
        select jsonb_agg(jsonb_build_object(
                 'slug', o.slug, 'name', o.name, 'logo_url', o.logo_url
               ) order by o.name)
        from public.organizer_members m
        join public.organizers o on o.id = m.organizer_id
        where m.user_id = p.id and m.role in ('owner', 'admin')
      ),
      '[]'::jsonb
    ) as organizers
  from public.profiles p
  where p.id = p_id
    and not p.is_banned;
$$;

comment on function public.host_profile is
  'Public profile for one host: safe columns plus hosted/attended counts. SECURITY DEFINER so the counts can be derived without exposing orders or tickets.';

grant execute on function public.host_profile(uuid) to anon, authenticated;

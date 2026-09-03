-- ============================================================================
-- Tazkarti :: 0002 organizers, teams, payment accounts, categories, venues
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Organizers (a brand/company that publishes events) and their team members.
-- ---------------------------------------------------------------------------
create table public.organizers (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references public.profiles(id) on delete restrict,
  name                text not null check (length(trim(name)) between 2 and 120),
  slug                text not null unique,
  description         text,
  logo_url            text,
  banner_url          text,
  website             text,
  support_email       text,
  support_phone       text,
  country             text,
  social_links        jsonb not null default '{}'::jsonb,
  verification_status public.verification_status not null default 'unverified',
  is_suspended        boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index organizers_owner_idx on public.organizers(owner_id);
create index organizers_slug_idx on public.organizers(slug);

create trigger organizers_set_updated_at
  before update on public.organizers
  for each row execute function public.set_updated_at();

create table public.organizer_members (
  organizer_id uuid not null references public.organizers(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         public.org_member_role not null default 'staff',
  created_at   timestamptz not null default now(),
  primary key (organizer_id, user_id)
);

create index organizer_members_user_idx on public.organizer_members(user_id);

-- Membership check used by every organizer-scoped RLS policy. Definer avoids
-- infinite recursion between organizers <-> organizer_members policies.
create or replace function public.is_org_member(p_organizer_id uuid, p_min_role public.org_member_role default 'scanner')
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.organizer_members m
    join public.profiles p on p.id = m.user_id
    where m.organizer_id = p_organizer_id
      and m.user_id = auth.uid()
      and not p.is_banned
      and case p_min_role
            when 'owner'   then m.role = 'owner'
            when 'admin'   then m.role in ('owner', 'admin')
            when 'staff'   then m.role in ('owner', 'admin', 'staff')
            else true
          end
  );
$$;

-- anon needs EXECUTE too: the public events SELECT policy calls this helper,
-- and a missing grant would raise instead of evaluating to false.
grant execute on function public.is_org_member(uuid, public.org_member_role) to authenticated, anon;

-- The creator is always seeded as owner, and promoted to the organizer role.
create or replace function public.handle_new_organizer()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.organizer_members (organizer_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (organizer_id, user_id) do update set role = 'owner';

  update public.profiles
     set role = 'organizer'
   where id = new.owner_id and role = 'attendee';

  return new;
end;
$$;

create trigger on_organizer_created
  after insert on public.organizers
  for each row execute function public.handle_new_organizer();

-- An organizer must always keep exactly one owner.
create or replace function public.guard_last_organizer_owner()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'DELETE' and old.role = 'owner')
     or (tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner') then
    if (select count(*) from public.organizer_members
         where organizer_id = old.organizer_id and role = 'owner') <= 1 then
      raise exception 'an organizer must have at least one owner' using errcode = 'P0001';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger organizer_members_guard_owner
  before update or delete on public.organizer_members
  for each row execute function public.guard_last_organizer_owner();

-- ---------------------------------------------------------------------------
-- Connected payment accounts. Each organizer brings their own Stripe account;
-- the platform charges on their behalf and takes an application fee.
-- ---------------------------------------------------------------------------
create table public.payment_accounts (
  id                 uuid primary key default gen_random_uuid(),
  organizer_id       uuid not null unique references public.organizers(id) on delete cascade,
  provider           public.payment_provider not null default 'stripe',
  stripe_account_id  text unique,
  charges_enabled    boolean not null default false,
  payouts_enabled    boolean not null default false,
  details_submitted  boolean not null default false,
  country            text,
  default_currency   text not null default 'USD',
  requirements_due   jsonb not null default '[]'::jsonb,
  livemode           boolean not null default false,
  connected_at       timestamptz,
  disconnected_at    timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger payment_accounts_set_updated_at
  before update on public.payment_accounts
  for each row execute function public.set_updated_at();

-- True when an organizer can actually take money right now.
create or replace function public.organizer_can_sell(p_organizer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(
    (select pa.charges_enabled and pa.disconnected_at is null
       from public.payment_accounts pa
      where pa.organizer_id = p_organizer_id),
    false
  );
$$;

grant execute on function public.organizer_can_sell(uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  icon        text not null default 'ticket',
  color       text not null default '#6366f1',
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index categories_active_idx on public.categories(is_active, sort_order);

-- ---------------------------------------------------------------------------
-- Venues, sections and the physical seat map
-- ---------------------------------------------------------------------------
create table public.venues (
  id            uuid primary key default gen_random_uuid(),
  organizer_id  uuid references public.organizers(id) on delete cascade,
  name          text not null check (length(trim(name)) between 2 and 160),
  slug          text not null unique,
  description   text,
  address_line1 text,
  address_line2 text,
  city          text not null default '',
  state         text,
  country       text not null default '',
  postal_code   text,
  latitude      numeric(9,6),
  longitude     numeric(9,6),
  timezone      text not null default 'UTC',
  capacity      integer check (capacity is null or capacity > 0),
  seating_type  public.seating_type not null default 'general_admission',
  image_url     text,
  is_active     boolean not null default true,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index venues_organizer_idx on public.venues(organizer_id);
create index venues_city_idx on public.venues(lower(city));

create trigger venues_set_updated_at
  before update on public.venues
  for each row execute function public.set_updated_at();

create table public.venue_sections (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references public.venues(id) on delete cascade,
  name       text not null,
  code       text not null,
  capacity   integer not null default 0 check (capacity >= 0),
  color      text not null default '#6366f1',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (venue_id, code)
);

create index venue_sections_venue_idx on public.venue_sections(venue_id, sort_order);

create table public.venue_seats (
  id            uuid primary key default gen_random_uuid(),
  venue_id      uuid not null references public.venues(id) on delete cascade,
  section_id    uuid not null references public.venue_sections(id) on delete cascade,
  row_label     text not null,
  seat_number   text not null,
  -- Normalised layout coordinates (0..1) so the map scales to any viewport.
  pos_x         numeric(6,4) not null default 0,
  pos_y         numeric(6,4) not null default 0,
  is_accessible boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (section_id, row_label, seat_number)
);

create index venue_seats_venue_idx on public.venue_seats(venue_id);
create index venue_seats_section_idx on public.venue_seats(section_id);

-- Keep section.capacity in step with the seats actually defined in it.
create or replace function public.sync_section_capacity()
returns trigger
language plpgsql
as $$
declare
  v_section uuid := coalesce(new.section_id, old.section_id);
begin
  update public.venue_sections s
     set capacity = (select count(*) from public.venue_seats where section_id = v_section)
   where s.id = v_section;
  return coalesce(new, old);
end;
$$;

create trigger venue_seats_sync_capacity
  after insert or delete on public.venue_seats
  for each row execute function public.sync_section_capacity();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.organizers        enable row level security;
alter table public.organizer_members enable row level security;
alter table public.payment_accounts  enable row level security;
alter table public.categories        enable row level security;
alter table public.venues            enable row level security;
alter table public.venue_sections    enable row level security;
alter table public.venue_seats       enable row level security;

-- Organizers: public profiles, managed by their own team.
create policy "organizers are publicly readable"
  on public.organizers for select using (true);

create policy "authenticated users create organizers they own"
  on public.organizers for insert to authenticated
  with check (auth.uid() = owner_id and public.is_active_user());

create policy "org admins update their organizer"
  on public.organizers for update to authenticated
  using (public.is_org_member(id, 'admin') or public.is_admin())
  with check (public.is_org_member(id, 'admin') or public.is_admin());

create policy "org owners delete their organizer"
  on public.organizers for delete to authenticated
  using (public.is_org_member(id, 'owner') or public.is_admin());

-- Members: visible to teammates, managed by org admins.
create policy "members are visible to the team"
  on public.organizer_members for select to authenticated
  using (user_id = auth.uid() or public.is_org_member(organizer_id, 'staff') or public.is_admin());

create policy "org admins add members"
  on public.organizer_members for insert to authenticated
  with check (public.is_org_member(organizer_id, 'admin') or public.is_admin());

create policy "org admins update members"
  on public.organizer_members for update to authenticated
  using (public.is_org_member(organizer_id, 'admin') or public.is_admin())
  with check (public.is_org_member(organizer_id, 'admin') or public.is_admin());

create policy "org admins remove members"
  on public.organizer_members for delete to authenticated
  using (public.is_org_member(organizer_id, 'admin') or public.is_admin());

-- Payment accounts: strictly private to the owning team.
create policy "team reads its payment account"
  on public.payment_accounts for select to authenticated
  using (public.is_org_member(organizer_id, 'admin') or public.is_admin());

create policy "team creates its payment account"
  on public.payment_accounts for insert to authenticated
  with check (public.is_org_member(organizer_id, 'admin'));

create policy "team updates its payment account"
  on public.payment_accounts for update to authenticated
  using (public.is_org_member(organizer_id, 'admin') or public.is_admin())
  with check (public.is_org_member(organizer_id, 'admin') or public.is_admin());

create policy "team disconnects its payment account"
  on public.payment_accounts for delete to authenticated
  using (public.is_org_member(organizer_id, 'admin') or public.is_admin());

-- Categories: read-only to the world, writable by admins.
create policy "categories are publicly readable"
  on public.categories for select using (true);

create policy "admins manage categories"
  on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Venues: public catalogue; organizers manage the ones they created.
create policy "venues are publicly readable"
  on public.venues for select using (true);

create policy "org staff create venues"
  on public.venues for insert to authenticated
  with check (
    public.is_admin()
    or (organizer_id is not null and public.is_org_member(organizer_id, 'staff'))
  );

create policy "org staff update their venues"
  on public.venues for update to authenticated
  using (public.is_admin() or (organizer_id is not null and public.is_org_member(organizer_id, 'staff')))
  with check (public.is_admin() or (organizer_id is not null and public.is_org_member(organizer_id, 'staff')));

create policy "org admins delete their venues"
  on public.venues for delete to authenticated
  using (public.is_admin() or (organizer_id is not null and public.is_org_member(organizer_id, 'admin')));

-- Sections and seats inherit the venue's permissions.
create policy "venue sections are publicly readable"
  on public.venue_sections for select using (true);

create policy "org staff manage venue sections"
  on public.venue_sections for all to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.venues v
      where v.id = venue_id and v.organizer_id is not null
        and public.is_org_member(v.organizer_id, 'staff')
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.venues v
      where v.id = venue_id and v.organizer_id is not null
        and public.is_org_member(v.organizer_id, 'staff')
    )
  );

create policy "venue seats are publicly readable"
  on public.venue_seats for select using (true);

create policy "org staff manage venue seats"
  on public.venue_seats for all to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.venues v
      where v.id = venue_id and v.organizer_id is not null
        and public.is_org_member(v.organizer_id, 'staff')
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.venues v
      where v.id = venue_id and v.organizer_id is not null
        and public.is_org_member(v.organizer_id, 'staff')
    )
  );

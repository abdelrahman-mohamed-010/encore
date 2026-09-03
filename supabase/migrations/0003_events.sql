-- ============================================================================
-- Tazkarti :: 0003 events, ticket types, per-event seat inventory
-- ============================================================================

create table public.events (
  id             uuid primary key default gen_random_uuid(),
  organizer_id   uuid not null references public.organizers(id) on delete cascade,
  category_id    uuid references public.categories(id) on delete set null,
  venue_id       uuid references public.venues(id) on delete set null,

  title          text not null check (length(trim(title)) between 3 and 160),
  slug           text not null unique,
  subtitle       text,
  description    text,
  cover_image_url text,
  gallery        jsonb not null default '[]'::jsonb,

  status         public.event_status not null default 'draft',
  visibility     public.event_visibility not null default 'public',
  seating_type   public.seating_type not null default 'general_admission',

  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  doors_open_at  timestamptz,
  timezone       text not null default 'UTC',

  is_online      boolean not null default false,
  online_url     text,

  sales_start_at timestamptz,
  sales_end_at   timestamptz,

  capacity       integer check (capacity is null or capacity > 0),
  min_age        integer check (min_age is null or min_age between 0 and 120),
  tags           text[] not null default '{}',
  refund_policy  text,
  terms          text,

  is_featured    boolean not null default false,
  view_count     integer not null default 0,
  published_at   timestamptz,
  cancelled_at   timestamptz,
  cancellation_reason text,
  rejection_reason    text,

  search_vector  tsvector,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint events_time_order check (ends_at > starts_at),
  constraint events_sales_window check (sales_end_at is null or sales_start_at is null or sales_end_at > sales_start_at),
  constraint events_online_needs_url check (not is_online or online_url is not null or status <> 'published'),
  constraint events_physical_needs_venue check (is_online or venue_id is not null or status = 'draft')
);

create index events_status_starts_idx on public.events(status, starts_at);
create index events_organizer_idx     on public.events(organizer_id, created_at desc);
create index events_category_idx      on public.events(category_id);
create index events_venue_idx         on public.events(venue_id);
create index events_featured_idx      on public.events(is_featured) where status = 'published';
create index events_tags_idx          on public.events using gin(tags);
create index events_search_idx        on public.events using gin(search_vector);
create index events_slug_idx          on public.events(slug);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- Full-text search vector, weighted title > subtitle/tags > description.
create or replace function public.events_build_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
      setweight(to_tsvector('simple', coalesce(new.title, '')), 'A')
   || setweight(to_tsvector('simple', coalesce(new.subtitle, '')), 'B')
   || setweight(to_tsvector('simple', coalesce(array_to_string(new.tags, ' '), '')), 'B')
   || setweight(to_tsvector('simple', left(coalesce(new.description, ''), 8000)), 'C');
  return new;
end;
$$;

create trigger events_search_vector
  before insert or update of title, subtitle, description, tags on public.events
  for each row execute function public.events_build_search_vector();

-- Slug is generated once from the title and kept unique with a short suffix.
create or replace function public.events_assign_slug()
returns trigger
language plpgsql
as $$
declare
  v_base text;
  v_slug text;
begin
  if new.slug is not null and length(trim(new.slug)) > 0 then
    return new;
  end if;
  v_base := nullif(public.slugify(new.title), '');
  if v_base is null then
    v_base := 'event';
  end if;
  v_base := left(v_base, 80);
  v_slug := v_base;
  while exists (select 1 from public.events where slug = v_slug and id is distinct from new.id) loop
    v_slug := v_base || '-' || lower(public.generate_code(5));
  end loop;
  new.slug := v_slug;
  return new;
end;
$$;

create trigger events_assign_slug_trg
  before insert on public.events
  for each row execute function public.events_assign_slug();

-- Stamp published_at / cancelled_at exactly once as status transitions.
create or replace function public.events_stamp_status()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  if new.status = 'cancelled' and new.cancelled_at is null then
    new.cancelled_at := now();
  end if;
  if new.status <> 'cancelled' then
    new.cancelled_at := null;
  end if;
  return new;
end;
$$;

create trigger events_stamp_status_trg
  before insert or update of status on public.events
  for each row execute function public.events_stamp_status();

-- ---------------------------------------------------------------------------
-- Ticket types
-- ---------------------------------------------------------------------------
create table public.ticket_types (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events(id) on delete cascade,
  section_id        uuid references public.venue_sections(id) on delete set null,

  name              text not null check (length(trim(name)) between 1 and 80),
  description       text,
  price_cents       integer not null check (price_cents >= 0),
  currency          text not null default 'USD',

  quantity_total    integer not null check (quantity_total >= 0),
  quantity_reserved integer not null default 0 check (quantity_reserved >= 0),
  quantity_sold     integer not null default 0 check (quantity_sold >= 0),

  min_per_order     integer not null default 1 check (min_per_order >= 1),
  max_per_order     integer not null default 10 check (max_per_order >= 1),

  sales_start_at    timestamptz,
  sales_end_at      timestamptz,

  is_hidden         boolean not null default false,
  badge_color       text not null default '#6366f1',
  sort_order        integer not null default 0,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint ticket_types_per_order_range check (max_per_order >= min_per_order),
  constraint ticket_types_not_oversold check (quantity_reserved + quantity_sold <= quantity_total),
  constraint ticket_types_sales_window check (sales_end_at is null or sales_start_at is null or sales_end_at > sales_start_at)
);

create index ticket_types_event_idx on public.ticket_types(event_id, sort_order);
create index ticket_types_section_idx on public.ticket_types(section_id);

create trigger ticket_types_set_updated_at
  before update on public.ticket_types
  for each row execute function public.set_updated_at();

-- Remaining inventory for a ticket type, never negative.
create or replace function public.ticket_type_available(p_ticket_type public.ticket_types)
returns integer
language sql
immutable
as $$
  select greatest(0, p_ticket_type.quantity_total - p_ticket_type.quantity_reserved - p_ticket_type.quantity_sold);
$$;

grant execute on function public.ticket_type_available(public.ticket_types) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Per-event seat inventory (reserved seating only)
-- ---------------------------------------------------------------------------
create table public.event_seats (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events(id) on delete cascade,
  seat_id        uuid not null references public.venue_seats(id) on delete cascade,
  ticket_type_id uuid references public.ticket_types(id) on delete set null,
  status         public.seat_status not null default 'available',
  price_cents    integer check (price_cents is null or price_cents >= 0),
  held_until     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (event_id, seat_id)
);

create index event_seats_event_status_idx on public.event_seats(event_id, status);
create index event_seats_ticket_type_idx  on public.event_seats(ticket_type_id);
create index event_seats_held_until_idx   on public.event_seats(held_until) where status = 'held';

create trigger event_seats_set_updated_at
  before update on public.event_seats
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Visibility helper: can the current viewer see this event at all?
-- ---------------------------------------------------------------------------
create or replace function public.can_view_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and (
        e.status = 'published' and e.visibility in ('public', 'unlisted')
        or public.is_org_member(e.organizer_id, 'scanner')
        or public.is_admin()
      )
  );
$$;

grant execute on function public.can_view_event(uuid) to authenticated, anon;

create or replace function public.can_manage_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and (public.is_org_member(e.organizer_id, 'staff') or public.is_admin())
  );
$$;

grant execute on function public.can_manage_event(uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.events       enable row level security;
alter table public.ticket_types enable row level security;
alter table public.event_seats  enable row level security;

create policy "published events are readable by everyone"
  on public.events for select
  using (
    (status = 'published' and visibility in ('public', 'unlisted'))
    or public.is_org_member(organizer_id, 'scanner')
    or public.is_admin()
  );

create policy "org staff create events"
  on public.events for insert to authenticated
  with check (public.is_org_member(organizer_id, 'staff') and public.is_active_user());

create policy "org staff update their events"
  on public.events for update to authenticated
  using (public.is_org_member(organizer_id, 'staff') or public.is_admin())
  with check (public.is_org_member(organizer_id, 'staff') or public.is_admin());

create policy "org admins delete their events"
  on public.events for delete to authenticated
  using (public.is_org_member(organizer_id, 'admin') or public.is_admin());

-- Only admins may move an event into 'published' when approval is required.
create or replace function public.guard_event_publication()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_requires_approval boolean;
begin
  select require_event_approval into v_requires_approval from public.platform_settings where id;

  if new.status = 'published' and coalesce(old.status, 'draft') <> 'published' then
    if coalesce(v_requires_approval, true) and not public.is_admin() then
      raise exception 'events must be approved by an administrator before publishing'
        using errcode = '42501', hint = 'Submit the event for review instead.';
    end if;
    if not public.organizer_can_sell(new.organizer_id)
       and exists (select 1 from public.ticket_types t where t.event_id = new.id and t.price_cents > 0) then
      raise exception 'connect a payment account before publishing paid tickets'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger events_guard_publication
  before update of status on public.events
  for each row execute function public.guard_event_publication();

-- Ticket types follow the event's visibility, hidden ones only for the team.
create policy "ticket types follow event visibility"
  on public.ticket_types for select
  using (
    public.can_view_event(event_id)
    and (not is_hidden or public.can_manage_event(event_id))
  );

create policy "org staff manage ticket types"
  on public.ticket_types for all to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

create policy "event seats follow event visibility"
  on public.event_seats for select
  using (public.can_view_event(event_id));

create policy "org staff manage event seats"
  on public.event_seats for all to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

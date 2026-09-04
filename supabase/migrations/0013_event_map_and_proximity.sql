-- 0013_event_map_and_proximity
--
-- Adds map support: events located on a map, and "what is on near me".
--
-- Deliberately additive. `search_events` is untouched — changing its return
-- type would require DROP + CREATE, and every page that calls it would error in
-- the gap between those two statements. A second function costs nothing and is
-- revertible by dropping it.

-- ---------------------------------------------------------------------------
-- Proximity support.
--
-- `earthdistance` (over `cube`) rather than PostGIS: we need one operation —
-- great-circle distance between two points — and it comes with a GiST index
-- that turns the radius filter into an index scan. PostGIS is the right answer
-- for polygons, routing or projections; none of which this app does.
-- ---------------------------------------------------------------------------
create extension if not exists cube with schema extensions;
create extension if not exists earthdistance with schema extensions;

-- Bounding-box index for the radius search. Partial, because a venue without
-- coordinates can never match a proximity query.
create index if not exists venues_earth_idx
  on public.venues
  using gist (extensions.ll_to_earth(latitude::float8, longitude::float8))
  where latitude is not null and longitude is not null;

-- ---------------------------------------------------------------------------
-- events_map
--
-- Same shape as search_events, plus venue coordinates and (when the caller
-- passes a location) the distance to each event.
--
-- SECURITY INVOKER by default, so RLS still applies: an unpublished or private
-- event is invisible here exactly as it is everywhere else.
-- ---------------------------------------------------------------------------
create or replace function public.events_map(
  p_organizer_slug text default null,
  p_category_slug  text default null,
  p_city           text default null,
  p_from           timestamptz default null,
  p_to             timestamptz default null,
  -- Viewer location. Both must be supplied for distance to be computed;
  -- with either null the function simply returns every match, unsorted by
  -- distance, which is the "show me everything on the map" case.
  p_lat            double precision default null,
  p_lng            double precision default null,
  p_radius_km      double precision default null,
  p_limit          integer default 200
)
returns table (
  id               uuid,
  slug             text,
  title            text,
  starts_at        timestamptz,
  ends_at          timestamptz,
  timezone         text,
  cover_image_url  text,
  is_featured      boolean,
  venue_name       text,
  venue_address    text,
  city             text,
  country          text,
  latitude         double precision,
  longitude        double precision,
  category_name    text,
  category_color   text,
  organizer_name   text,
  organizer_slug   text,
  min_price_cents  integer,
  currency         text,
  is_sold_out      boolean,
  distance_km      double precision
)
language sql
stable
set search_path = public, extensions, pg_catalog
as $$
  with base as (
    select
      e.id, e.slug, e.title, e.starts_at, e.ends_at, e.timezone,
      e.cover_image_url, e.is_featured,
      v.name as venue_name,
      nullif(trim(concat_ws(', ', v.address_line1, v.city)), '') as venue_address,
      coalesce(v.city, '')    as city,
      coalesce(v.country, '') as country,
      v.latitude::float8  as latitude,
      v.longitude::float8 as longitude,
      c.name  as category_name,
      c.color as category_color,
      o.name  as organizer_name,
      o.slug  as organizer_slug,
      t.min_price_cents,
      t.currency,
      coalesce(t.tickets_left, 0) <= 0 as is_sold_out,
      case
        when p_lat is null or p_lng is null then null::float8
        else extensions.earth_distance(
               extensions.ll_to_earth(p_lat, p_lng),
               extensions.ll_to_earth(v.latitude::float8, v.longitude::float8)
             ) / 1000.0
      end as distance_km
    from public.events e
    join public.venues v      on v.id = e.venue_id
    left join public.categories c on c.id = e.category_id
    join public.organizers o  on o.id = e.organizer_id
    left join lateral (
      select
        min(tt.price_cents)::int as min_price_cents,
        min(tt.currency)         as currency,
        greatest(0, sum(tt.quantity_total - tt.quantity_reserved - tt.quantity_sold))::int
                                 as tickets_left
      from public.ticket_types tt
      where tt.event_id = e.id and not tt.is_hidden
    ) t on true
    where e.status = 'published'
      and e.visibility = 'public'
      and e.ends_at >= now()
      -- An online event has no place on a map.
      and not e.is_online
      and v.latitude is not null
      and v.longitude is not null
      and (p_organizer_slug is null or o.slug = p_organizer_slug)
      and (p_category_slug  is null or c.slug = p_category_slug)
      and (p_city is null or lower(v.city) = lower(p_city))
      and (p_from is null or e.starts_at >= p_from)
      and (p_to   is null or e.starts_at <= p_to)
      -- The bounding-box operator is what the GiST index can answer; the exact
      -- great-circle distance is then checked in the outer query.
      and (
        p_lat is null or p_lng is null or p_radius_km is null
        or extensions.ll_to_earth(v.latitude::float8, v.longitude::float8)
             <@ extensions.earth_box(extensions.ll_to_earth(p_lat, p_lng), p_radius_km * 1000.0)
      )
  )
  select
    b.id, b.slug, b.title, b.starts_at, b.ends_at, b.timezone,
    b.cover_image_url, b.is_featured,
    b.venue_name, b.venue_address, b.city, b.country,
    b.latitude, b.longitude,
    b.category_name, b.category_color,
    b.organizer_name, b.organizer_slug,
    b.min_price_cents, b.currency, b.is_sold_out,
    b.distance_km
  from base b
  -- earth_box is a bounding square, so it over-selects at the corners; this
  -- trims the result back to a true circle.
  where p_radius_km is null or b.distance_km is null or b.distance_km <= p_radius_km
  order by
    case when b.distance_km is null then 1 else 0 end,
    b.distance_km asc nulls last,
    b.starts_at asc
  limit greatest(1, least(coalesce(p_limit, 200), 500));
$$;

comment on function public.events_map is
  'Published, in-person events with venue coordinates for map display. Pass p_lat/p_lng/p_radius_km to restrict to a radius and sort by distance.';

grant execute on function public.events_map to anon, authenticated;

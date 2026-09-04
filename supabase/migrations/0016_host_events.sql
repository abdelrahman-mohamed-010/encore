-- 0016_host_events
--
-- The event lists on a public host profile.
--
-- A person can host under several organizers, so this cannot be expressed as a
-- filter on one organizer slug. Doing it client-side would mean either N
-- queries or exposing `organizer_members`, which is deliberately not public —
-- so it is one SECURITY DEFINER function that reads memberships internally and
-- returns nothing but already-public event columns.

create or replace function public.host_events(
  p_id   uuid,
  p_past boolean default false,
  p_limit integer default 12
)
returns table (
  id              uuid,
  slug            text,
  title           text,
  starts_at       timestamptz,
  ends_at         timestamptz,
  timezone        text,
  cover_image_url text,
  city            text,
  venue_name      text,
  organizer_name  text,
  organizer_slug  text,
  min_price_cents integer,
  currency        text
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select
    e.id, e.slug, e.title, e.starts_at, e.ends_at, e.timezone,
    e.cover_image_url,
    coalesce(v.city, '') as city,
    v.name as venue_name,
    o.name as organizer_name,
    o.slug as organizer_slug,
    t.min_price_cents,
    t.currency
  from public.events e
  join public.organizers o        on o.id = e.organizer_id
  join public.organizer_members m on m.organizer_id = e.organizer_id
  left join public.venues v       on v.id = e.venue_id
  left join lateral (
    select min(tt.price_cents)::int as min_price_cents, min(tt.currency) as currency
    from public.ticket_types tt
    where tt.event_id = e.id and not tt.is_hidden
  ) t on true
  where m.user_id = p_id
    and m.role in ('owner', 'admin')
    and e.status = 'published'
    and e.visibility = 'public'
    -- Upcoming is "has not finished"; past is everything behind us.
    and case when p_past then e.ends_at < now() else e.ends_at >= now() end
  order by
    case when p_past then e.starts_at end desc,
    case when p_past then null else e.starts_at end asc
  limit greatest(1, least(coalesce(p_limit, 12), 50));
$$;

comment on function public.host_events is
  'Public events a person hosts (upcoming, or past). SECURITY DEFINER so memberships stay private while the events they imply are public.';

grant execute on function public.host_events(uuid, boolean, integer) to anon, authenticated;

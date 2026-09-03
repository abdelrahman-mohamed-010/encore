-- ============================================================================
-- Tazkarti :: 0007 discovery, analytics, storage buckets
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Faceted event search. SECURITY INVOKER on purpose: RLS keeps unpublished and
-- private events out of the result set automatically.
-- ---------------------------------------------------------------------------
create or replace function public.search_events(
  p_query         text default null,
  p_category_slug text default null,
  p_city          text default null,
  p_from          timestamptz default null,
  p_to            timestamptz default null,
  p_max_price     integer default null,
  p_free_only     boolean default false,
  p_featured_only boolean default false,
  p_organizer_slug text default null,
  p_sort          text default 'soonest',
  p_limit         integer default 24,
  p_offset        integer default 0
)
returns table (
  id               uuid,
  slug             text,
  title            text,
  subtitle         text,
  cover_image_url  text,
  starts_at        timestamptz,
  ends_at          timestamptz,
  timezone         text,
  is_online        boolean,
  is_featured      boolean,
  city             text,
  country          text,
  venue_name       text,
  category_name    text,
  category_slug    text,
  category_color   text,
  organizer_name   text,
  organizer_slug   text,
  min_price_cents  integer,
  max_price_cents  integer,
  currency         text,
  tickets_left     integer,
  is_sold_out      boolean,
  total_count      bigint
)
language sql
stable
as $$
  with base as (
    select
      e.id, e.slug, e.title, e.subtitle, e.cover_image_url,
      e.starts_at, e.ends_at, e.timezone, e.is_online, e.is_featured,
      coalesce(v.city, '')    as city,
      coalesce(v.country, '') as country,
      v.name  as venue_name,
      c.name  as category_name,
      c.slug  as category_slug,
      c.color as category_color,
      o.name  as organizer_name,
      o.slug  as organizer_slug,
      e.search_vector,
      e.view_count,
      e.published_at,
      t.min_price_cents,
      t.max_price_cents,
      t.currency,
      t.tickets_left
    from public.events e
    left join public.venues v      on v.id = e.venue_id
    left join public.categories c  on c.id = e.category_id
    join public.organizers o       on o.id = e.organizer_id
    left join lateral (
      select
        min(tt.price_cents)::int as min_price_cents,
        max(tt.price_cents)::int as max_price_cents,
        min(tt.currency)         as currency,
        greatest(0, sum(tt.quantity_total - tt.quantity_reserved - tt.quantity_sold))::int as tickets_left
      from public.ticket_types tt
      where tt.event_id = e.id and not tt.is_hidden
    ) t on true
    where e.status = 'published'
      and e.visibility = 'public'
      and e.ends_at >= now()
      and (p_query is null or length(trim(p_query)) = 0
           or e.search_vector @@ websearch_to_tsquery('simple', p_query))
      and (p_category_slug is null or c.slug = p_category_slug)
      and (p_city is null or lower(v.city) = lower(p_city))
      and (p_from is null or e.starts_at >= p_from)
      and (p_to is null or e.starts_at <= p_to)
      and (p_organizer_slug is null or o.slug = p_organizer_slug)
      and (not coalesce(p_featured_only, false) or e.is_featured)
      and (not coalesce(p_free_only, false) or coalesce(t.min_price_cents, 0) = 0)
      and (p_max_price is null or coalesce(t.min_price_cents, 0) <= p_max_price)
  ),
  counted as (select count(*) as n from base)
  select
    b.id, b.slug, b.title, b.subtitle, b.cover_image_url,
    b.starts_at, b.ends_at, b.timezone, b.is_online, b.is_featured,
    b.city, b.country, b.venue_name,
    b.category_name, b.category_slug, b.category_color,
    b.organizer_name, b.organizer_slug,
    coalesce(b.min_price_cents, 0), coalesce(b.max_price_cents, 0),
    coalesce(b.currency, 'USD'),
    coalesce(b.tickets_left, 0),
    coalesce(b.tickets_left, 0) <= 0,
    counted.n
  from base b, counted
  order by
    case when p_sort = 'price_low'  then coalesce(b.min_price_cents, 0) end asc nulls last,
    case when p_sort = 'price_high' then coalesce(b.min_price_cents, 0) end desc nulls last,
    case when p_sort = 'popular'    then b.view_count end desc nulls last,
    case when p_sort = 'newest'     then b.published_at end desc nulls last,
    case when p_sort not in ('price_low', 'price_high', 'popular', 'newest')
         then b.starts_at end asc nulls last,
    b.starts_at asc
  limit greatest(1, least(coalesce(p_limit, 24), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;

grant execute on function public.search_events(text, text, text, timestamptz, timestamptz, integer, boolean, boolean, text, text, integer, integer) to authenticated, anon;

-- Live availability for one event, used by the ticket picker.
create or replace function public.event_availability(p_event_id uuid)
returns table (
  ticket_type_id uuid,
  name           text,
  price_cents    integer,
  currency       text,
  available      integer,
  quantity_total integer,
  min_per_order  integer,
  max_per_order  integer,
  on_sale        boolean
)
language sql
stable
as $$
  select
    tt.id,
    tt.name,
    tt.price_cents,
    tt.currency,
    greatest(0, tt.quantity_total - tt.quantity_reserved - tt.quantity_sold)::int,
    tt.quantity_total,
    tt.min_per_order,
    least(tt.max_per_order, greatest(0, tt.quantity_total - tt.quantity_reserved - tt.quantity_sold))::int,
    (tt.sales_start_at is null or now() >= tt.sales_start_at)
      and (tt.sales_end_at is null or now() <= tt.sales_end_at)
  from public.ticket_types tt
  where tt.event_id = p_event_id and not tt.is_hidden
  order by tt.sort_order, tt.price_cents;
$$;

grant execute on function public.event_availability(uuid) to authenticated, anon;

-- Count a page view without granting UPDATE on events to the world.
create or replace function public.increment_event_views(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  update public.events set view_count = view_count + 1 where id = p_event_id and status = 'published';
end;
$$;

grant execute on function public.increment_event_views(uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Tenant analytics
-- ---------------------------------------------------------------------------
create or replace function public.organizer_stats(p_organizer_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  v_result jsonb;
begin
  if not (public.is_org_member(p_organizer_id, 'staff') or public.is_admin()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'gross_cents',      coalesce(sum(o.total_cents) filter (where o.status in ('paid', 'partially_refunded')), 0),
    'net_cents',        coalesce(sum(o.total_cents - o.refunded_cents - o.fee_cents) filter (where o.status in ('paid', 'partially_refunded')), 0),
    'refunded_cents',   coalesce(sum(o.refunded_cents), 0),
    'platform_fees_cents', coalesce(sum(o.fee_cents) filter (where o.status in ('paid', 'partially_refunded')), 0),
    'orders_paid',      count(*) filter (where o.status in ('paid', 'partially_refunded')),
    'orders_pending',   count(*) filter (where o.status = 'pending'),
    'currency',         coalesce(min(o.currency), 'USD')
  ) into v_result
  from public.orders o
  where o.organizer_id = p_organizer_id;

  return v_result || jsonb_build_object(
    'tickets_sold', (
      select count(*) from public.tickets t
      join public.events e on e.id = t.event_id
      where e.organizer_id = p_organizer_id and t.status in ('valid', 'used')
    ),
    'tickets_checked_in', (
      select count(*) from public.tickets t
      join public.events e on e.id = t.event_id
      where e.organizer_id = p_organizer_id and t.status = 'used'
    ),
    'events_total', (select count(*) from public.events where organizer_id = p_organizer_id),
    'events_published', (select count(*) from public.events where organizer_id = p_organizer_id and status = 'published'),
    'events_upcoming', (select count(*) from public.events where organizer_id = p_organizer_id and status = 'published' and starts_at > now())
  );
end;
$$;

grant execute on function public.organizer_stats(uuid) to authenticated;

-- Daily revenue/ticket series for dashboard charts.
create or replace function public.organizer_sales_series(
  p_organizer_id uuid,
  p_days integer default 30,
  p_event_id uuid default null
)
returns table (day date, gross_cents bigint, orders bigint, tickets bigint)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
begin
  if not (public.is_org_member(p_organizer_id, 'staff') or public.is_admin()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  return query
  with days as (
    select generate_series(
      (current_date - (greatest(1, least(coalesce(p_days, 30), 365)) - 1) * interval '1 day')::date,
      current_date,
      interval '1 day'
    )::date as day
  ),
  paid as (
    select date_trunc('day', o.paid_at)::date as day,
           sum(o.total_cents)::bigint as gross_cents,
           count(*)::bigint as orders,
           coalesce(sum((select count(*) from public.tickets t where t.order_id = o.id)), 0)::bigint as tickets
      from public.orders o
     where o.organizer_id = p_organizer_id
       and o.status in ('paid', 'partially_refunded')
       and o.paid_at is not null
       and (p_event_id is null or o.event_id = p_event_id)
     group by 1
  )
  select d.day,
         coalesce(p.gross_cents, 0),
         coalesce(p.orders, 0),
         coalesce(p.tickets, 0)
    from days d
    left join paid p on p.day = d.day
   order by d.day;
end;
$$;

grant execute on function public.organizer_sales_series(uuid, integer, uuid) to authenticated;

-- Per-event breakdown used on the event manage screen.
create or replace function public.event_stats(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  v_org uuid;
begin
  select organizer_id into v_org from public.events where id = p_event_id;
  if v_org is null then
    raise exception 'event not found' using errcode = 'P0002';
  end if;
  if not (public.is_org_member(v_org, 'scanner') or public.is_admin()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'gross_cents', (select coalesce(sum(total_cents), 0) from public.orders
                     where event_id = p_event_id and status in ('paid', 'partially_refunded')),
    'orders', (select count(*) from public.orders where event_id = p_event_id and status in ('paid', 'partially_refunded')),
    'tickets_sold', (select count(*) from public.tickets where event_id = p_event_id and status in ('valid', 'used')),
    'tickets_checked_in', (select count(*) from public.tickets where event_id = p_event_id and status = 'used'),
    'capacity', (select coalesce(sum(quantity_total), 0) from public.ticket_types where event_id = p_event_id),
    'views', (select view_count from public.events where id = p_event_id),
    'by_ticket_type', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'name', tt.name,
               'sold', tt.quantity_sold,
               'reserved', tt.quantity_reserved,
               'total', tt.quantity_total,
               'price_cents', tt.price_cents,
               'gross_cents', tt.quantity_sold * tt.price_cents
             ) order by tt.sort_order), '[]'::jsonb)
        from public.ticket_types tt where tt.event_id = p_event_id
    )
  );
end;
$$;

grant execute on function public.event_stats(uuid) to authenticated;

-- Platform-wide numbers for the admin console.
create or replace function public.admin_platform_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'organizers', (select count(*) from public.organizers),
    'events_published', (select count(*) from public.events where status = 'published'),
    'events_pending', (select count(*) from public.events where status = 'pending_review'),
    'orders_paid', (select count(*) from public.orders where status in ('paid', 'partially_refunded')),
    'tickets_sold', (select count(*) from public.tickets where status in ('valid', 'used')),
    'gross_cents', (select coalesce(sum(total_cents), 0) from public.orders where status in ('paid', 'partially_refunded')),
    'platform_fees_cents', (select coalesce(sum(fee_cents), 0) from public.orders where status in ('paid', 'partially_refunded'))
  );
end;
$$;

grant execute on function public.admin_platform_stats() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('event-images',   'event-images',   true, 8388608,  array['image/jpeg','image/png','image/webp','image/avif','image/gif']),
  ('organizer-logos','organizer-logos',true, 4194304,  array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml']),
  ('avatars',        'avatars',        true, 2097152,  array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;

create policy "public read of event images"
  on storage.objects for select
  using (bucket_id in ('event-images', 'organizer-logos', 'avatars'));

-- Uploads are namespaced by the uploader's user id: <uid>/<filename>
create policy "users upload into their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('event-images', 'organizer-logos', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users update their own uploads"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('event-images', 'organizer-logos', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete their own uploads"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('event-images', 'organizer-logos', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

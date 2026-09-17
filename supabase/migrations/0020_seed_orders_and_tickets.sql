-- =============================================================================
-- 0020_seed_orders_and_tickets.sql
--
-- Demand, so the catalogue looks lived in rather than freshly minted.
--
-- Orders are generated rather than listed: a deterministic slice of events gets
-- between two and six of them, drawn from the attendee accounts that already
-- exist. Tickets are then expanded from the order lines — one row per unit
-- bought, which is exactly what the checkout RPC does — so a seeded ticket is
-- indistinguishable from a bought one.
--
-- Every order carries metadata->>'seed', which is how this data stays separable
-- from anything bought through the real checkout.
-- =============================================================================

-- ---------- orders -----------------------------------------------------------
with buyers as (
  select p.id, p.full_name, p.email,
         row_number() over (order by p.email) - 1 as n,
         count(*) over () as total
  from public.profiles p
  where p.email like '%@example.com'
     or p.email in ('demo@tazkarti.app', 'admin@tazkarti.app')
),
sellable as (
  select t.id as ticket_type_id, t.price_cents, t.event_id,
         e.organizer_id, e.starts_at, e.slug,
         row_number() over (partition by t.event_id order by t.sort_order) as tier_no,
         ('x' || substr(md5(e.slug), 1, 6))::bit(24)::int as h
  from public.ticket_types t
  join public.events e on e.id = t.event_id
  join public._seed_events_raw r on r.slug = e.slug
  where e.status in ('published', 'completed')
    and r.kind not in ('soldout', 'seated')
    and not t.is_hidden
),
plan as (
  select s.*, g.i,
         (s.h + g.i * 7) % (select total from buyers limit 1) as buyer_n,
         1 + ((s.h + g.i) % 3) as qty
  from sellable s
  cross join lateral generate_series(1, 2 + (s.h % 5)) as g(i)
  where s.h % 3 = 0                        -- roughly a third of events see demand
    and s.tier_no = 1 + ((s.h + g.i) % 2)  -- alternating between the first two tiers
)
insert into public.orders (
  id, user_id, event_id, organizer_id, status, subtotal_cents, discount_cents,
  fee_cents, tax_cents, total_cents, currency, buyer_name, buyer_email,
  payment_provider, payment_status, application_fee_cents, created_at, paid_at, metadata)
select
  md5('tazkarti:order:' || p.slug || ':' || p.ticket_type_id || ':' || p.i)::uuid,
  b.id, p.event_id, p.organizer_id, 'paid'::order_status,
  p.price_cents * p.qty, 0,
  case when p.price_cents = 0 then 0 else greatest(500, (p.price_cents * p.qty * 5) / 100) end, 0,
  p.price_cents * p.qty
    + case when p.price_cents = 0 then 0 else greatest(500, (p.price_cents * p.qty * 5) / 100) end,
  'USD', b.full_name, b.email,
  'sandbox'::payment_provider, 'succeeded'::payment_status,
  case when p.price_cents = 0 then 0 else greatest(500, (p.price_cents * p.qty * 5) / 100) end,
  p.starts_at - make_interval(days => 3 + (p.h + p.i) % 25),
  p.starts_at - make_interval(days => 3 + (p.h + p.i) % 25),
  jsonb_build_object('seed', 'demo-catalogue')
from plan p
join buyers b on b.n = p.buyer_n
on conflict (id) do nothing;

-- ---------- order lines ------------------------------------------------------
insert into public.order_items (id, order_id, ticket_type_id, ticket_type_name,
  quantity, unit_price_cents, subtotal_cents)
select
  md5('tazkarti:oi:' || o.id::text)::uuid,
  o.id, t.id, t.name,
  case when t.price_cents = 0
       then 1 + (('x' || substr(md5(o.id::text), 1, 4))::bit(16)::int % 3)
       else greatest(1, o.subtotal_cents / t.price_cents) end,
  t.price_cents, o.subtotal_cents
from public.orders o
join lateral (
  select tt.* from public.ticket_types tt
  where tt.event_id = o.event_id and not tt.is_hidden
  order by tt.sort_order limit 1
) t on true
where o.metadata->>'seed' = 'demo-catalogue'
  and not exists (select 1 from public.order_items oi where oi.order_id = o.id)
on conflict (id) do nothing;

-- ---------- tickets ----------------------------------------------------------
-- A ticket for an event that has already finished is marked checked in, bar a
-- deterministic quarter left unscanned: a real door never gets everyone in.
insert into public.tickets (order_id, order_item_id, event_id, ticket_type_id,
  owner_user_id, attendee_name, attendee_email, status, issued_at, checked_in_at)
select
  o.id, oi.id, o.event_id, oi.ticket_type_id, o.user_id, o.buyer_name, o.buyer_email,
  case when e.ends_at < now() and n % 4 <> 3 then 'used' else 'valid' end::ticket_status,
  o.created_at,
  case when e.ends_at < now() and n % 4 <> 3 then e.starts_at + interval '12 minutes' end
from public.order_items oi
join public.orders o on o.id = oi.order_id
join public.events e on e.id = o.event_id
cross join lateral generate_series(1, oi.quantity) as n
where o.metadata->>'seed' = 'demo-catalogue'
  and not exists (select 1 from public.tickets t where t.order_item_id = oi.id);

-- ---------- reconcile --------------------------------------------------------
-- Availability is recomputed from the tickets that actually landed, so the
-- number on a card can never drift from the rows behind it. The allocation is
-- raised in the same statement where demand overshot it; splitting that into a
-- second pass would transiently violate the not-oversold constraint.
update public.ticket_types t
set quantity_sold  = s.n,
    quantity_total = greatest(t.quantity_total, s.n)
from (
  select ticket_type_id, count(*) n
  from public.tickets where status in ('valid', 'used')
  group by ticket_type_id
) s
where s.ticket_type_id = t.id
  and (t.quantity_sold is distinct from s.n or t.quantity_total < s.n);

-- The handful of events meant to read as sold out are drained here, so the
-- badge is a consequence of the inventory rather than a flag set by hand.
update public.ticket_types t
set quantity_sold = t.quantity_total
from public.events e
join public._seed_events_raw r on r.slug = e.slug
where e.id = t.event_id and r.kind = 'soldout' and t.quantity_sold < t.quantity_total;

-- ---------- favourites -------------------------------------------------------
insert into public.favorites (user_id, event_id)
select b.id, e.id
from (
  select p.id, row_number() over (order by p.email) - 1 as n
  from public.profiles p where p.email like '%@example.com'
) b
join lateral (
  select e.id from public.events e
  where e.status = 'published' and e.ends_at >= now()
  order by md5(e.id::text || b.n::text) limit 4
) e on true
on conflict do nothing;

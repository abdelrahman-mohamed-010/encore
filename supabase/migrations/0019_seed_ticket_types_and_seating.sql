-- =============================================================================
-- 0019_seed_ticket_types_and_seating.sql
--
-- What each seeded event sells.
--
-- The tier shape follows the event's kind and topic: a free night gets one free
-- tier, a supper club sells a seat at the table and a chef's counter, a gig
-- sells early bird / general / VIP.
--
-- Reserved-seating events are different in kind, and the rule they obey is:
--   a tier is sellable only if seats point at it, and its allocation equals
--   the number of those seats.
-- So their tiers mirror the venue's sections, every seat is pointed at the tier
-- for its own section, and quantity_total is counted from the seats rather than
-- guessed. Getting that wrong produces tiers with a zero allocation that the UI
-- still offers and the reservation RPC then refuses — which is exactly what a
-- buyer experiences as "could not hold those tickets".
-- =============================================================================

-- ---------- general admission ------------------------------------------------
with tiers(kind, topic, sort, name, price_cents, qty, max_per_order) as (values
  ('free',   null, 0, 'Free entry', 0, 150, 4),
  ('online', null, 0, 'Free entry', 0, 300, 4),
  ('paid', 'food',       0, 'Seat at the table', 65000,  40, 6),
  ('paid', 'food',       1, E'Chef\'s counter',  95000,  10, 4),
  ('paid', 'music',      0, 'Early bird',        25000, 100, 6),
  ('paid', 'music',      1, 'General admission', 35000, 400, 6),
  ('paid', 'music',      2, 'VIP',               85000,  40, 4),
  ('paid', 'conference', 0, 'Standard',          45000, 120, 6),
  ('paid', 'conference', 1, 'Student',           15000,  40, 2),
  ('paid', 'theatre',    0, 'Stalls',            60000, 120, 6),
  ('paid', 'theatre',    1, 'Balcony',           35000,  80, 6),
  ('paid', 'arts',       0, 'Workshop place',    40000,  20, 2),
  ('paid', 'sports',     0, 'Entry',             12000, 200, 6),
  ('paid', 'comedy',     0, 'Standard',          20000,  90, 6),
  ('paid', 'comedy',     1, 'Front row',         32000,  20, 4),
  ('paid', 'film',       0, 'Screening',         18000,  90, 6),
  ('paid', 'wellness',   0, 'Class pass',        22000,  25, 2),
  ('paid', 'community',  0, 'Entry',             10000, 120, 6),
  ('soldout', null, 0, 'General admission', 30000, 120, 6)
)
insert into public.ticket_types (id, event_id, name, price_cents, currency,
  quantity_total, quantity_sold, min_per_order, max_per_order, sort_order)
select
  md5('tazkarti:tt:' || r.slug || ':' || t.sort)::uuid,
  e.id, t.name, t.price_cents, 'USD', t.qty, 0, 1, t.max_per_order, t.sort
from public._seed_events_raw r
join public.events e on e.slug = r.slug
join tiers t on t.kind = r.kind and (t.topic is null or t.topic = r.topic)
where r.kind <> 'seated'
  and not exists (select 1 from public.ticket_types x where x.event_id = e.id)
on conflict (id) do nothing;

-- ---------- reserved seating -------------------------------------------------
-- One tier per section, priced by how close the section sits to the stage.
insert into public.ticket_types (id, event_id, section_id, name, price_cents,
  currency, quantity_total, quantity_sold, min_per_order, max_per_order, sort_order)
select
  md5('tazkarti:seattier:' || e.id::text || ':' || sec.id::text)::uuid,
  e.id, sec.id, sec.name,
  case rank() over (partition by e.id order by sec.sort_order)
    when 1 then 60000 when 2 then 45000 else 30000 end,
  'USD', 0, 0, 1, 6,
  (rank() over (partition by e.id order by sec.sort_order))::int - 1
from public.events e
join public._seed_events_raw r  on r.slug = e.slug and r.kind = 'seated'
join public.venue_sections sec  on sec.venue_id = e.venue_id
on conflict (id) do nothing;

-- Lay the seats out, each pointed at the tier for its own section.
insert into public.event_seats (id, event_id, seat_id, ticket_type_id, status, price_cents)
select gen_random_uuid(), e.id, vs.id, t.id, 'available'::seat_status, t.price_cents
from public.events e
join public.venue_seats vs     on vs.venue_id = e.venue_id
join public.venue_sections sec on sec.id = vs.section_id
join public.ticket_types t     on t.event_id = e.id and t.section_id = sec.id
where e.seating_type = 'reserved_seating'
  and not exists (
    select 1 from public.event_seats es where es.event_id = e.id and es.seat_id = vs.id
  );

-- An allocation is the seats that actually point at the tier — never a guess.
with counts as (
  select t.id, count(es.id) as n
  from public.ticket_types t
  join public.events e on e.id = t.event_id and e.seating_type = 'reserved_seating'
  left join public.event_seats es on es.ticket_type_id = t.id
  group by t.id
)
update public.ticket_types t
set quantity_total = c.n
from counts c
where c.id = t.id and t.quantity_total is distinct from c.n and c.n >= t.quantity_sold;

-- A seated tier that owns no seats is unsellable. Drop it when it has no
-- history; hide it when it does, so its tickets survive but it stops being
-- offered.
delete from public.ticket_types t
using public.events e
where e.id = t.event_id
  and e.seating_type = 'reserved_seating'
  and not exists (select 1 from public.event_seats es  where es.ticket_type_id = t.id)
  and not exists (select 1 from public.tickets tk      where tk.ticket_type_id = t.id)
  and not exists (select 1 from public.order_items oi  where oi.ticket_type_id = t.id)
  and not exists (select 1 from public.reservation_items ri where ri.ticket_type_id = t.id);

update public.ticket_types t
set is_hidden = true
from public.events e
where e.id = t.event_id
  and e.seating_type = 'reserved_seating'
  and not t.is_hidden
  and not exists (select 1 from public.event_seats es where es.ticket_type_id = t.id);

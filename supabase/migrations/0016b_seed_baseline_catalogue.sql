-- =============================================================================
-- 0016b_seed_baseline_catalogue.sql
--
-- The categories, founding organizers and seated venues the rest of the seed
-- builds on.
--
-- Like the demo accounts in 0016a, these rows were created by hand during the
-- first build and never written down, so the chain could not reproduce them.
-- Replaying from empty surfaced it twice over: every event landed with a null
-- category because no category existed, and the ten opera-house events failed
-- the events_physical_needs_venue check because their venue did not either.
--
-- The seated venues matter most. 0019 builds a reserved-seating tier per
-- section and points each seat at the tier for its own section, so without
-- these sections and seats there is nothing for a seated event to sell.
--
-- Seat coordinates are computed rather than listed. pos_x and pos_y are
-- fractions of the seat map, so a row is (index + 0.5) / count — the half step
-- centres each seat in its own cell instead of pushing the first one against
-- the edge. That reproduces the live layout exactly and keeps 640 seats
-- readable as four lines of intent.
--
-- Everything is keyed by the id the live rows already carry, so re-running
-- against the live project matches and skips rather than duplicating.
-- =============================================================================

-- ---------- categories -------------------------------------------------------
insert into public.categories (id, slug, name, icon, color, sort_order, is_active)
values
 ('cabaee7d-b4de-4512-8505-619977e86748','music','Music','music','#8b5cf6',1,true),
 ('9d4cb966-b8cb-416e-a868-431fd65af164','theatre','Theatre','drama','#ec4899',2,true),
 ('14329379-0449-4774-bbfc-8cb7c76bc137','sports','Sports','trophy','#f59e0b',3,true),
 ('a9fd0ff0-024b-4fe4-a097-1dbb284baf79','conference','Conference','presentation','#0ea5e9',4,true),
 ('23955723-cb12-4c17-8352-3cf787abab9b','comedy','Comedy','laugh','#22c55e',5,true),
 ('16360a32-65d2-4d3b-a932-83f425a9841d','film','Film','clapperboard','#ef4444',6,true),
 ('500b3e3d-b1ac-43b2-b5e5-54d509548f7a','food','Food','utensils','#f97316',7,true),
 ('7a4e67fc-6068-4759-9219-2f88bd26d2dd','arts','Arts','palette','#14b8a6',8,true)
on conflict (id) do nothing;

-- ---------- founding organizers ----------------------------------------------
-- Their owners come from 0016a; both are referenced by slug in 0018's catalogue.
insert into public.organizers (id, slug, name, owner_id, verification_status,
  description, logo_url, banner_url)
values
 ('11111111-1111-1111-1111-111111111111','cairo-live-nation','Cairo Live Nation',
  'cf2ecb3d-150c-43e5-ac16-58ab2f6842e8','verified',
  'Egypt''s biggest promoter of live music — arena tours, desert raves and everything in between.',
  'https://picsum.photos/seed/cairolive-logo/256/256',
  'https://picsum.photos/seed/cairolive-banner/1600/500'),
 ('22222222-2222-2222-2222-222222222222','nile-arts-collective','Nile Arts Collective',
  '328c128c-3ea2-4eb3-82aa-500894483dc4','verified',
  'Independent theatre, ballet and classical performance staged along the Nile.',
  'https://picsum.photos/seed/nilearts-logo/256/256',
  'https://picsum.photos/seed/nilearts-banner/1600/500')
on conflict (id) do nothing;

insert into public.organizer_members (organizer_id, user_id, role)
select o.id, o.owner_id, 'owner'::org_member_role
from public.organizers o
where o.slug in ('cairo-live-nation','nile-arts-collective')
on conflict (organizer_id, user_id) do nothing;

update public.profiles p set role = 'organizer'
where p.role = 'attendee'
  and exists (select 1 from public.organizer_members m
              where m.user_id = p.id and m.role = 'owner');

-- Both sell paid tickets, so both need an account that can take charges.
--
-- The guard is on organizer_id, not on the id this statement would generate.
-- payment_accounts.organizer_id is unique, so an organizer that was connected
-- by hand already holds a row under an id of its own; conflicting on the
-- generated id would miss that row and the insert would fail on the unique
-- constraint instead of doing nothing.
insert into public.payment_accounts (id, organizer_id, provider, stripe_account_id,
  charges_enabled, payouts_enabled, details_submitted, country, default_currency, connected_at)
select md5('tazkarti:pay:'||o.slug)::uuid, o.id, 'stripe'::payment_provider,
       'acct_demo_'||o.slug, true, true, true, 'EG', 'USD', now()
from public.organizers o
where o.slug in ('cairo-live-nation','nile-arts-collective')
  and not exists (
    select 1 from public.payment_accounts pa where pa.organizer_id = o.id
  );

-- ---------- venues -----------------------------------------------------------
insert into public.venues (id, slug, name, organizer_id, address_line1, city,
  country, latitude, longitude, capacity, timezone)
select t.id::uuid, t.slug, t.name, o.id, t.addr, t.city, t.country,
       t.lat, t.lon, t.cap, t.tz
from (values
 ('aaaaaaa1-0000-4000-8000-000000000001','cairo-international-stadium','Cairo International Stadium','cairo-live-nation','Nasr City','Cairo','EG',30.0688,31.3122,74000,'Africa/Cairo'),
 ('aaaaaaa1-0000-4000-8000-000000000002','cairo-opera-house-main-hall','Cairo Opera House — Main Hall','nile-arts-collective','Gezira Island, Zamalek','Cairo','EG',30.0424,31.2242,480,'Africa/Cairo'),
 ('aaaaaaa1-0000-4000-8000-000000000003','the-greek-campus','The Greek Campus','cairo-live-nation','171 Tahrir Street, Downtown','Cairo','EG',30.0444,31.2357,900,'Africa/Cairo'),
 ('aaaaaaa1-0000-4000-8000-000000000004','sahel-beach-arena','Sahel Beach Arena','cairo-live-nation','Sidi Abdel Rahman','Marsa Matrouh','EG',30.9600,28.8900,12000,'Africa/Cairo'),
 ('aaaaaaa1-0000-4000-8000-000000000005','zamalek-arts-center','Zamalek Arts Center','nile-arts-collective','18 Hassan Sabry St, Zamalek','Cairo','EG',30.0605,31.2200,220,'Africa/Cairo')
) as t(id, slug, name, org, addr, city, country, lat, lon, cap, tz)
join public.organizers o on o.slug = t.org
on conflict (id) do nothing;

-- ---------- sections ---------------------------------------------------------
insert into public.venue_sections (id, venue_id, name, code, capacity, color, sort_order)
select t.id::uuid, v.id, t.name, t.code, 160, t.color, t.sort
from (values
 ('bbbbbbb1-0000-4000-8000-000000000001','cairo-opera-house-main-hall','Orchestra','ORCH','#8b5cf6',1),
 ('bbbbbbb1-0000-4000-8000-000000000002','cairo-opera-house-main-hall','Mezzanine','MEZZ','#0ea5e9',2),
 ('bbbbbbb1-0000-4000-8000-000000000003','cairo-opera-house-main-hall','Balcony', 'BALC','#f59e0b',3),
 ('001b18ec-8090-4e60-8703-47fff035f60a','zamalek-arts-center',        'Orchestra','ORC', '#8b5cf6',0)
) as t(id, venue, name, code, color, sort)
join public.venues v on v.slug = t.venue
on conflict (id) do nothing;

-- ---------- seats ------------------------------------------------------------
-- Ten rows of sixteen per section. The id is derived from the section and the
-- seat's own label so a re-run lands on the same row rather than a second copy.
insert into public.venue_seats (id, venue_id, section_id, row_label, seat_number, pos_x, pos_y)
select
  md5('tazkarti:seat:' || s.id::text || ':' || r.label || ':' || n.num)::uuid,
  s.venue_id, s.id, r.label, n.num::text,
  ((n.num - 1) + 0.5) / 16,
  ((r.idx + 0.5) + 10 * band.idx) / (10 * band.total)
from public.venue_sections s
join (
  -- a section's band within its own venue, top to bottom
  select id, venue_id,
         rank() over (partition by venue_id order by sort_order) - 1 as idx,
         count(*) over (partition by venue_id) as total
  from public.venue_sections
) band on band.id = s.id
cross join (values ('A',0),('B',1),('C',2),('D',3),('E',4),
                   ('F',5),('G',6),('H',7),('I',8),('J',9)) as r(label, idx)
cross join generate_series(1, 16) as n(num)
where not exists (
  select 1 from public.venue_seats vs
  where vs.section_id = s.id and vs.row_label = r.label and vs.seat_number = n.num::text
);

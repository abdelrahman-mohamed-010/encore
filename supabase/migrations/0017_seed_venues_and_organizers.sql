-- =============================================================================
-- 0017_seed_venues_and_organizers.sql
--
-- Part one of the demo catalogue: the places events happen and the people who
-- run them. Venues are real Egyptian rooms; organizers are owned by profiles
-- that already exist, so seeding the catalogue needs no new auth accounts.
--
-- This is DATA, not structure. It ships as a migration so the CLI and the live
-- database cannot drift apart. Every statement is idempotent and every id is
-- derived from a stable slug, so re-running is a no-op rather than a second
-- copy of everything.
--
-- Cover images are Unsplash photo ids, each one verified to return HTTP 200
-- before being written here.
-- =============================================================================

insert into public.venues (id, name, slug, city, country, address_line1, latitude, longitude, timezone, capacity, seating_type, image_url, is_active)
select md5('tazkarti:venue:'||k)::uuid, n, 'v-'||k, city, 'EG', addr, lat, lng, 'Africa/Cairo', cap, 'general_admission',
       'https://images.unsplash.com/'||photo||'?auto=format&fit=crop&w=1200&q=70', true
from (values
 ('kodak','Kodak Passageway','Cairo','Adly St, Downtown',30.0489,31.2432,300,'photo-1513364776144-60967b0f800f'),
 ('darb','Darb 1718 Contemporary Art Centre','Cairo','Kasr El Sham3 St, Old Cairo',30.0006,31.2306,450,'photo-1531243269054-5ebf6f34081e'),
 ('tapas','Tap Maadi','Cairo','Road 9, Maadi',29.9598,31.2578,180,'photo-1517248135467-4c7edcad34c4'),
 ('kempinski','Kempinski Nile Rooftop','Cairo','Corniche El Nil, Garden City',30.0343,31.2295,220,'photo-1555396273-367ea4eb4db5'),
 ('elsawy','El Sawy Culturewheel','Cairo','26th of July Corridor, Zamalek',30.0611,31.2236,700,'photo-1459749411175-04bf5292ceea'),
 ('cairojazz','Cairo Jazz Club 610','Giza','Sheikh Zayed',30.0176,30.9770,400,'photo-1514320291840-2e0a9bf2a9ae'),
 ('gouna','G-Space El Gouna','Hurghada','El Gouna Marina',27.3940,33.6780,900,'photo-1429962714451-bb934ecdc4ec'),
 ('bibliotheca','Bibliotheca Alexandrina — Great Hall','Alexandria','Shatby Corniche',31.2089,29.9092,1600,'photo-1531482615713-2afd69097998'),
 ('stanley','Stanley Beach Terrace','Alexandria','Stanley, Corniche',31.2456,29.9613,350,'photo-1517248135467-4c7edcad34c4'),
 ('almaza','Almaza Bay Beach Club','Marsa Matrouh','Almaza Bay',31.4700,27.2200,2500,'photo-1506157786151-b8491531f063'),
 ('wadi','Wadi Degla Protectorate','Cairo','Maadi Ring Road',29.9400,31.3600,600,'photo-1546519638-68e109498ffc'),
 ('gezira','Gezira Sporting Club — Court 3','Cairo','Zamalek',30.0560,31.2240,1200,'photo-1546519638-68e109498ffc'),
 ('zed','Zed Park Arena','Giza','Sheikh Zayed',30.0400,30.9700,5000,'photo-1517649763962-0c623066013b'),
 ('factory','The Factory Space','Cairo','Talaat Harb, Downtown',30.0478,31.2400,160,'photo-1478720568477-152d9b164e26'),
 ('garden','Fustat Garden Amphitheatre','Cairo','Ain El Sira, Fustat',30.0089,31.2439,800,'photo-1514306191717-452ec28c7814'),
 ('tahrir','Tahrir Cultural Center — AUC','Cairo','Tahrir Square',30.0444,31.2357,500,'photo-1531482615713-2afd69097998')
) as t(k,n,city,addr,lat,lng,cap,photo)
on conflict (id) do nothing;

insert into public.organizers (id, owner_id, name, slug, description, logo_url, banner_url, website, support_email, country, verification_status)
select md5('tazkarti:org:'||k)::uuid, owner::uuid, n, k, descr,
       'https://images.unsplash.com/'||logo||'?auto=format&fit=crop&w=600&q=70',
       'https://images.unsplash.com/'||banner||'?auto=format&fit=crop&w=1600&q=70',
       'https://'||k||'.example', 'hello@'||k||'.example', 'EG', ver::verification_status
from (values
 ('koshary','Koshary Nights Supper Club','5e232e47-9413-485b-8929-2ce0380722c6','verified',
  'Roaming supper club plating modern Egyptian food in rooftops, gardens and the odd warehouse.',
  'photo-1555396273-367ea4eb4db5','photo-1504674900247-0877df9cc836'),
 ('sahelsessions','Sahel Sessions','9be87b48-0294-404e-a9d5-bbb205fdd28c','verified',
  'Beach parties and sunset sets on the north coast and the Red Sea, from May to the last warm weekend.',
  'photo-1459749411175-04bf5292ceea','photo-1429962714451-bb934ecdc4ec'),
 ('cairorunners','Cairo Runners Club','774157fb-4c7b-4de8-b280-d6115621f9dc','verified',
  'Free weekly runs across the city since 2012. Everyone finishes, nobody races.',
  'photo-1517649763962-0c623066013b','photo-1546519638-68e109498ffc'),
 ('townhouse','Townhouse Cinema Club','332dabe5-f583-4f10-8a3a-cffd427f7b03','verified',
  'Restored classics, regional premieres and director Q&As in a converted downtown factory.',
  'photo-1478720568477-152d9b164e26','photo-1536440136628-849c177e76a1'),
 ('basement','The Comedy Basement','467dd3ee-819b-4643-9d47-d3aceffcc6b5','verified',
  'Stand-up six nights a week — open mics on Monday, touring headliners at the weekend.',
  'photo-1499364615650-ec38552f4f34','photo-1585699324551-f6c309eedeca'),
 ('maadimakers','Maadi Makers','e7812d1e-271a-440a-9285-9e64bac56c80','verified',
  'Hands-on workshops for engineers, designers and the stubbornly curious.',
  'photo-1511578314322-379afb476865','photo-1531482615713-2afd69097998'),
 ('zamalekyoga','Zamalek Yoga Collective','60a5efff-22b0-4bcf-ab5a-b85c7bcc47a1','unverified',
  'Morning rooftop flows, breathwork and the occasional silent walk along the Nile.',
  'photo-1476480862126-209bfaa8edc8','photo-1588286840104-8957b019727f'),
 ('alexbooks','Alexandria Book House','ffb716af-1f57-46fc-8400-7d93c73d3d9a','verified',
  'Readings, translation nights and a book fair that takes over the Corniche each autumn.',
  'photo-1530103862676-de8c9debad1d','photo-1543269865-cbf427effbad')
) as t(k,n,owner,ver,descr,logo,banner)
on conflict (id) do nothing;

-- The owner membership is created by a trigger on insert, but assert it so a
-- re-run can never leave a half-built membership set.
insert into public.organizer_members (organizer_id, user_id, role)
select o.id, o.owner_id, 'owner'::org_member_role from public.organizers o
on conflict (organizer_id, user_id) do nothing;

-- Owning an organization makes you an organizer.
update public.profiles p set role = 'organizer'
where p.role = 'attendee'
  and exists (select 1 from public.organizer_members m where m.user_id = p.id and m.role = 'owner');

-- Paid events need an account that can take charges. Cairo Runners and Zamalek
-- Yoga are left unconnected on purpose: their events are free, and that is the
-- state the dashboard's Stripe prompt exists for.
insert into public.payment_accounts (id, organizer_id, provider, stripe_account_id, charges_enabled, payouts_enabled, details_submitted, country, default_currency, connected_at)
select md5('tazkarti:pay:'||k)::uuid, md5('tazkarti:org:'||k)::uuid, 'stripe'::payment_provider,
       'acct_demo_'||k, true, true, true, 'EG', 'USD', now()
from (values ('koshary'),('sahelsessions'),('townhouse'),('basement'),('maadimakers'),('alexbooks')) as t(k)
on conflict (id) do nothing;

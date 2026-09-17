-- =============================================================================
-- 0016a_seed_demo_accounts.sql
--
-- The demo accounts the catalogue seed hangs off.
--
-- 0017 assigns each organizer an owner by id, and 0020 draws its buyers from
-- the @example.com profiles. Both were written against accounts that had been
-- created by hand through sign-up, so nothing in this chain actually created
-- them: a fresh `supabase db push` failed at 0017 on the owner foreign key.
-- This migration closes that gap so the chain reproduces the live database from
-- empty.
--
-- It is numbered 0016a rather than renumbering 0017 onwards, because those
-- files have already been applied to the live project and their names are how
-- the migration history identifies them.
--
-- Profiles are not inserted here. auth.users carries an after-insert trigger
-- (0001) that creates the matching profile row, so seeding the auth side is
-- enough and the two can never disagree.
--
-- The token columns are written as empty strings rather than left NULL. GoTrue
-- scans them into Go strings, and a NULL breaks sign-in for *every* account —
-- the failure 0012 exists to repair. Seeding them correctly here means that
-- repair has nothing to do.
--
-- Re-running is a no-op: every row conflicts on its id and is skipped, so an
-- existing account keeps whatever password it already has. Accounts outside
-- this list are never touched.
-- =============================================================================

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token,
  reauthentication_token)
select
  t.id::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  t.email,
  extensions.crypt('TazkartiDemo!2026', extensions.gen_salt('bf')),
  now(),
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
  jsonb_build_object('full_name', t.full_name),
  now(), now(),
  '', '', '', '', '', '', '', ''
from (values
  ('fe98e644-86ea-459b-bd9c-afc841521d40','admin@tazkarti.app',        'Amira Hassan'),
  ('305caf02-8dab-46ea-81e2-ae917f5cca2e','demo@tazkarti.app',         'Nour Ibrahim'),
  ('796d8186-6b36-4b25-aaf7-c537bb8b4f11','staff@tazkarti.app',        'Omar Adel'),
  ('cf2ecb3d-150c-43e5-ac16-58ab2f6842e8','cairolive@tazkarti.app',    'Karim Fouad'),
  ('328c128c-3ea2-4eb3-82aa-500894483dc4','nilearts@tazkarti.app',     'Nile Arts Collective'),
  ('332dabe5-f583-4f10-8a3a-cffd427f7b03','laila.rifaat@example.com',  'Laila Rifaat'),
  ('467dd3ee-819b-4643-9d47-d3aceffcc6b5','ziad.rageb@example.com',    'Ziad Rageb'),
  ('e7812d1e-271a-440a-9285-9e64bac56c80','sara.halim@example.com',    'Sara Halim'),
  ('60a5efff-22b0-4bcf-ab5a-b85c7bcc47a1','mariam.saleh@example.com',  'Mariam Saleh'),
  ('ffb716af-1f57-46fc-8400-7d93c73d3d9a','youssef.nabil@example.com', 'Youssef Nabil'),
  ('5e232e47-9413-485b-8929-2ce0380722c6','dalia.sherif@example.com',  'Dalia Sherif'),
  ('dab8a286-ed25-414d-a849-1f3b832fdd5e','ahmed.zaki@example.com',    'Ahmed Zaki'),
  ('69172bc4-26f7-4288-8e5d-7fae91ce9191','farida.kamel@example.com',  'Farida Kamel'),
  ('a4638dd0-2815-4d44-9380-bc53f6838e6c','hana.darwish@example.com',  'Hana Darwish'),
  ('9be87b48-0294-404e-a9d5-bbb205fdd28c','kareem.wagdy@example.com',  'Kareem Wagdy'),
  ('774157fb-4c7b-4de8-b280-d6115621f9dc','mostafa.louis@example.com', 'Mostafa Louis'),
  ('3f6e3848-e592-46e5-9309-6d5c5736a11f','salma.ashraf@example.com',  'Salma Ashraf'),
  ('4e2a6ad4-87f1-4a65-9999-75545b575de4','tarek.mansour@example.com', 'Tarek Mansour')
) as t(id, email, full_name)
on conflict (id) do nothing;

-- The trigger fills in the name from user metadata on insert, but an account
-- that already existed keeps whatever its profile said. Backfill only the ones
-- that never got a name, so a profile edited in the app is left alone.
update public.profiles p
set full_name = t.full_name
from (values
  ('fe98e644-86ea-459b-bd9c-afc841521d40','Amira Hassan'),
  ('305caf02-8dab-46ea-81e2-ae917f5cca2e','Nour Ibrahim'),
  ('796d8186-6b36-4b25-aaf7-c537bb8b4f11','Omar Adel'),
  ('cf2ecb3d-150c-43e5-ac16-58ab2f6842e8','Karim Fouad'),
  ('332dabe5-f583-4f10-8a3a-cffd427f7b03','Laila Rifaat'),
  ('467dd3ee-819b-4643-9d47-d3aceffcc6b5','Ziad Rageb'),
  ('e7812d1e-271a-440a-9285-9e64bac56c80','Sara Halim'),
  ('60a5efff-22b0-4bcf-ab5a-b85c7bcc47a1','Mariam Saleh'),
  ('ffb716af-1f57-46fc-8400-7d93c73d3d9a','Youssef Nabil'),
  ('5e232e47-9413-485b-8929-2ce0380722c6','Dalia Sherif'),
  ('dab8a286-ed25-414d-a849-1f3b832fdd5e','Ahmed Zaki'),
  ('69172bc4-26f7-4288-8e5d-7fae91ce9191','Farida Kamel'),
  ('a4638dd0-2815-4d44-9380-bc53f6838e6c','Hana Darwish'),
  ('9be87b48-0294-404e-a9d5-bbb205fdd28c','Kareem Wagdy'),
  ('774157fb-4c7b-4de8-b280-d6115621f9dc','Mostafa Louis'),
  ('3f6e3848-e592-46e5-9309-6d5c5736a11f','Salma Ashraf'),
  ('4e2a6ad4-87f1-4a65-9999-75545b575de4','Tarek Mansour')
) as t(id, full_name)
where p.id = t.id::uuid
  and coalesce(nullif(trim(p.full_name), ''), '') = '';

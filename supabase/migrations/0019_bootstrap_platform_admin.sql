-- ============================================================================
-- Tazkarti :: 0019 bootstrap the first platform administrator
-- ============================================================================
--
-- profiles.role is the only thing that grants platform-wide access, and
-- `guard_profile_privileged_columns` lets nobody but an existing admin set it.
-- That is the right rule, but it leaves a fresh database with no way in: the
-- /admin console, event approval and user management are all unreachable
-- because the first admin can never be created through the product.
--
-- Migrations run without a JWT, which the guard treats as a trusted server
-- context, so this is the one place the first one can be made.
--
-- Idempotent, and a no-op in any environment where that account does not
-- exist — so it will not invent an administrator on someone else's database.

update public.profiles p
   set role = 'admin'
  from auth.users u
 where u.id = p.id
   and u.email = 'admin@tazkarti.app'
   and p.role <> 'admin';

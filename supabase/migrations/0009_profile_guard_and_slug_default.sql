-- ============================================================================
-- Tazkarti :: 0009 two corrections found while wiring the app
-- ============================================================================

-- 1. The role/ban guard blocked EVERY change not made by a signed-in admin,
--    which also blocked trusted server contexts (service role, migrations,
--    psql) where auth.uid() is null. RLS already denies those updates for anon
--    and non-admin users, so the guard only needs to police requests that
--    actually carry a user JWT.
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'role can only be changed by an administrator' using errcode = '42501';
  end if;
  if new.is_banned is distinct from old.is_banned then
    raise exception 'ban status can only be changed by an administrator' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- 2. events.slug is filled by a BEFORE INSERT trigger, but with no column
--    default the generated TypeScript types marked it as a required insert
--    field. An empty-string default keeps the trigger in charge and lets
--    clients omit it.
alter table public.events alter column slug set default '';

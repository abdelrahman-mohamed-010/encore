-- 0011_allow_organizer_deletion
--
-- Deleting an organizer always failed with "an organizer must have at least one
-- owner". Deleting the organizer row cascades into organizer_members, and the
-- last-owner guard fired on that cascaded DELETE even though the parent it was
-- protecting was itself on its way out.
--
-- Fix: when the parent organizer no longer exists, the membership row is part of
-- a cascade, so let it through. The guard still protects every real removal or
-- demotation of the last owner of a live organizer.

create or replace function public.guard_last_organizer_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  -- Cascade from `delete from organizers`: the parent is already gone, so there
  -- is no organizer left to leave ownerless.
  if tg_op = 'DELETE'
     and not exists (select 1 from public.organizers where id = old.organizer_id) then
    return old;
  end if;

  if (tg_op = 'DELETE' and old.role = 'owner')
     or (tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner') then
    if (select count(*) from public.organizer_members
         where organizer_id = old.organizer_id and role = 'owner') <= 1 then
      raise exception 'an organizer must have at least one owner' using errcode = 'P0001';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

-- 0014_media_storage
--
-- A storage bucket so organizers can upload images instead of pasting a URL to
-- something they host elsewhere (which breaks the moment that host expires).
--
-- Path convention, which the policies below depend on:
--
--   avatars/<user_id>/<file>              a person's own picture
--   organizers/<organizer_id>/<file>      logo and cover
--   events/<organizer_id>/<file>          event cover art
--
-- The second segment is always the id that owns the file, so write access is a
-- single check against that segment. Files are never deleted on overwrite —
-- each upload gets a fresh name — so a stale URL in an old page render keeps
-- resolving instead of 404ing.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  -- Public read: these are event posters on public pages, and signing every
  -- one would defeat CDN caching for no privacy gain.
  true,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Who may write where.
--
-- `storage.foldername(name)` splits the object path; element 1 is the section
-- and element 2 is the owning id.
-- ---------------------------------------------------------------------------
create or replace function public.can_write_media(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, storage, pg_catalog
as $$
declare
  parts text[] := storage.foldername(p_name);
  owner_id uuid;
begin
  if auth.uid() is null or array_length(parts, 1) < 2 then
    return false;
  end if;

  -- A malformed second segment is a rejection, not an error: an uploader
  -- controls this string.
  begin
    owner_id := parts[2]::uuid;
  exception when invalid_text_representation then
    return false;
  end;

  return case parts[1]
    when 'avatars'    then owner_id = auth.uid()
    -- 'staff' and above: scanners check people in, they do not edit artwork.
    when 'organizers' then public.is_org_member(owner_id, 'staff')
    when 'events'     then public.is_org_member(owner_id, 'staff')
    else false
  end;
end;
$$;

comment on function public.can_write_media is
  'True when the caller owns the media path they are writing to. Drives the storage.objects policies for the media bucket.';

grant execute on function public.can_write_media(text) to authenticated;

drop policy if exists "media is publicly readable" on storage.objects;
create policy "media is publicly readable"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "members upload their own media" on storage.objects;
create policy "members upload their own media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.can_write_media(name));

drop policy if exists "members replace their own media" on storage.objects;
create policy "members replace their own media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.can_write_media(name))
  with check (bucket_id = 'media' and public.can_write_media(name));

drop policy if exists "members delete their own media" on storage.objects;
create policy "members delete their own media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.can_write_media(name));

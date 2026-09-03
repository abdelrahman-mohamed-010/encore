-- ============================================================================
-- Tazkarti :: 0008 pin search_path on the remaining helper/trigger functions
-- so a rogue schema earlier in a caller's search_path cannot shadow the
-- tables and operators they resolve.
-- ============================================================================
alter function public.set_updated_at()                set search_path = public, pg_catalog;
alter function public.slugify(text)                   set search_path = public, pg_catalog;
alter function public.generate_code(int)              set search_path = public, pg_catalog;
alter function public.guard_last_organizer_owner()    set search_path = public, pg_catalog;
alter function public.sync_section_capacity()         set search_path = public, pg_catalog;
alter function public.events_build_search_vector()    set search_path = public, pg_catalog;
alter function public.events_assign_slug()            set search_path = public, pg_catalog;
alter function public.events_stamp_status()           set search_path = public, pg_catalog;
alter function public.ticket_type_available(public.ticket_types) set search_path = public, pg_catalog;
alter function public.orders_assign_number()          set search_path = public, pg_catalog;
alter function public.tickets_assign_code()           set search_path = public, pg_catalog;
alter function public.event_availability(uuid)        set search_path = public, pg_catalog;
alter function public.search_events(text, text, text, timestamptz, timestamptz, integer, boolean, boolean, text, text, integer, integer)
  set search_path = public, pg_catalog;

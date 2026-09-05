-- ============================================================================
-- Tazkarti :: 0018 release expired holds without waiting for the next buyer
-- ============================================================================
--
-- `expire_reservations` was only ever called from inside `create_reservation`,
-- so a hold was released when the *next* person tried to book the same event —
-- and never at all if nobody did. An abandoned checkout left its seats sitting
-- at status 'held' and its tier's quantity_reserved inflated indefinitely, so
-- the seats read as taken and the tier read as short of stock long after the
-- ten minutes were up.
--
-- The function itself was always correct, idempotent and safe to call from
-- anywhere. It simply had nothing calling it on a clock.

create extension if not exists pg_cron;

-- cron.schedule replaces a job of the same name, so re-running is safe.
select cron.schedule(
  'expire-reservations',
  '* * * * *',
  $job$ select public.expire_reservations() $job$
);

-- Release anything already stranded by the old behaviour.
select public.expire_reservations();

-- =============================================================================
-- 0021_drop_seed_scaffolding.sql
--
-- 0018 stages its catalogue in public._seed_events_raw so that 0019 and 0020
-- can read back each event's ticketing kind — which tier shape to build, and
-- which events are meant to read as sold out. Once 0020 has run, nothing needs
-- it again: every fact it carried now lives in events, ticket_types and seats.
--
-- It is dropped here rather than at the end of 0020 so the three seed
-- migrations stay individually re-runnable. Dropping it inside 0020 would mean
-- a second pass over 0019 or 0020 hit a missing table instead of being the
-- no-op it is.
-- =============================================================================

drop table if exists public._seed_events_raw;

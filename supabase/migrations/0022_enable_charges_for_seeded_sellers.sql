-- =============================================================================
-- 0022_enable_charges_for_seeded_sellers.sql
--
-- An organizer with paid tickets on sale has to be able to take money.
--
-- The catalogue seed hands paid events to every organizer that suits the
-- programming, but two of the founding organizers were left half-connected from
-- the first build: Nile Arts Collective had no payment account at all, and
-- Cairo Live Nation had one with charges_enabled false. Both now sell paid
-- tickets, and /api/orders/[orderId]/intent refuses to create a payment intent
-- unless the organizer has a stripe_account_id with charges enabled — so their
-- paid events could be browsed and held, then failed at the last step.
--
-- This closes that gap from the data side: the events are real, so the account
-- behind them has to be too. It runs after 0020 because the condition is "sells
-- something priced above zero", which is only knowable once tiers exist.
--
-- Two deliberate exclusions:
--   * Only accounts whose stripe_account_id looks like the demo ones are
--     touched, so a real Stripe account connected through onboarding is never
--     switched on by a migration.
--   * Organizers with no paid tier keep no account at all. Cairo Runners and
--     Zamalek Yoga run free events, and the dashboard's "connect Stripe" prompt
--     needs an unconnected organizer to be worth showing.
-- =============================================================================

update public.payment_accounts pa
set charges_enabled   = true,
    payouts_enabled   = true,
    details_submitted = true,
    connected_at      = coalesce(pa.connected_at, now()),
    disconnected_at   = null
where pa.stripe_account_id like 'acct_demo\_%'
  and (not pa.charges_enabled or pa.disconnected_at is not null)
  and exists (
    select 1
    from public.events e
    join public.ticket_types t on t.event_id = e.id
    where e.organizer_id = pa.organizer_id
      and e.status in ('published', 'completed')
      and t.price_cents > 0
  );

-- An organizer selling paid tickets with no account at all gets the same demo
-- connection the rest of the seeded organizers have.
insert into public.payment_accounts (id, organizer_id, provider, stripe_account_id,
  charges_enabled, payouts_enabled, details_submitted, country, default_currency, connected_at)
select md5('tazkarti:pay:' || o.slug)::uuid, o.id, 'stripe'::payment_provider,
       'acct_demo_' || o.slug, true, true, true, 'EG', 'USD', now()
from public.organizers o
where not exists (select 1 from public.payment_accounts pa where pa.organizer_id = o.id)
  and exists (
    select 1
    from public.events e
    join public.ticket_types t on t.event_id = e.id
    where e.organizer_id = o.id
      and e.status in ('published', 'completed')
      and t.price_cents > 0
  );

# Encore

A multi-tenant event ticketing platform. Organizers create events, sell tickets
on **their own Stripe account**, and check people in at the door; attendees
browse, book, and carry QR tickets in their pocket.

Built with Next.js 16 (App Router), Supabase (Postgres + Auth + Storage + RLS),
Tailwind CSS v4 and Stripe Connect.

---

## What is in here

**Multi-tenancy.** An *organizer* is a tenant: its own events, venues, promo
codes, orders, payouts and team. Every table is protected by row-level security
keyed on tenant membership, so one organizer can never read another's orders,
promo codes or payment account — this is enforced in Postgres, not in the app.

**Team roles.** `owner` → `admin` → `staff` → `scanner`, checked by a single
`is_org_member(organizer_id, min_role)` function that every policy calls.

**Inventory that cannot oversell.** Tickets are held, not just counted. Choosing
tickets creates a time-boxed *reservation*; the hold is taken inside one
transaction with `SELECT … FOR UPDATE` on the affected rows, in a deterministic
order. Clients have no `INSERT`/`UPDATE` grant on inventory at all — every
mutation goes through a `SECURITY DEFINER` function — and a `CHECK` constraint
(`quantity_reserved + quantity_sold <= quantity_total`) is the last line of
defence if the logic is ever wrong.

**Reserved seating.** Venues can carry a full seat map (sections → rows →
seats). Per-event seat inventory is materialised so a seat can be priced,
blocked or sold independently, and a held seat is locked against a second buyer.

**Payments the organizer owns.** Each organizer connects their own Stripe
account through Connect OAuth. Charges are created on that account with
Encore's service fee as `application_fee_amount`, so the organizer is the
merchant of record and payouts follow their own Stripe schedule. Refunds pull
the platform fee back proportionally.

**A sandbox rail.** Until an organizer connects Stripe — and for free orders —
checkout settles through a built-in simulated provider that runs the *same*
finalisation path a real webhook does. The whole product is usable end to end
with no payment credentials at all.

**Check-in.** Every ticket carries a code plus a server-side secret; the QR
encodes both. Scanning verifies the pair, so a code read off someone's
screenshot admits nobody. Every scan attempt is logged, valid or not.

---

## Architecture

Routes live in `app/`, domain code in `features/`, and only genuinely
cross-cutting things in `components/` and `lib/`.

```
src/
  app/
    (site)/            public storefront + attendee account
    (fullbleed)/       pages that opt out of the site header
    auth/              sign in, sign up, password reset, OAuth callback
    checkout/          hold → order → pay
    dashboard/[slug]/  tenant-scoped organizer console
    admin/             platform console
    api/               webhooks, Stripe Connect, and the money-path routes
  features/<domain>/   account admin auth catalog checkout dashboard events
                       home map organizers promos scan seating team
    queries.ts         reads. "server-only", returning typed DTOs
    actions.ts         writes. "use server", validated and authorised
    components/        that domain's UI
    hooks/             hooks only that domain uses
  components/
    ui/                the design system primitives
    layout/            the app shell
  lib/                 shared by two or more features: supabase clients,
                       payments, pricing, roles, validation, format, env
supabase/migrations/   the schema, in order
tests/unit/            Vitest
tests/e2e/             Playwright + a PostgREST-shaped mock
```

### Where data access lives

Two rules, both enforced rather than documented:

**Every read is a query.** Pages and components do not talk to Postgres; reads
live in a feature's `queries.ts`, are marked `server-only`, and return an
explicit DTO rather than a cast. The one exception is the profile lookup that
follows sign-in, which needs the session the browser has just established.

**Every write is a server action.** Mutations run on the server through
`next-safe-action`, validated by the *same* zod schema the form uses, and
authorised by `requireOrgAccess` before touching a row. The browser Supabase
client is reserved for what genuinely needs it — Supabase auth, storage uploads
and one edge function — and `npm run lint` errors if anything else imports it.

That means business rules hold on the server, not just in the UI: the ticket
capacity floor, the refusal to delete a type that has sales, and owner-only
promotion to owner are all re-checked in the action.

Caching follows from this. Writes call `revalidatePath`, so the ISR pages are
busted by a change rather than waiting out a timer, and
`experimental.staleTimes.dynamic` keeps a route you just left in the client
router cache instead of refetching it — without that, every auth-cookie route
replayed its skeleton on back-navigation.

### The money path

1. `create_reservation` locks inventory and returns a hold with an expiry.
2. `create_order_from_reservation` freezes the amounts into a `pending` order.
3. The provider is consulted — Stripe PaymentIntent, or the sandbox rail.
4. `finalize_order_payment` converts held stock to sold, issues tickets, and
   marks the order paid. It is **idempotent**, so a replayed webhook is a no-op,
   and it is gated by a shared server secret that never reaches a browser.

If the hold expires before payment lands, finalisation refuses and the tickets
are already back on sale.

---

## Running it

```bash
npm install
cp .env.example .env.local     # fill in your Supabase project
npm run dev
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required and
checked by `src/env.ts` when the build starts. They are inlined into the client
bundle, so a build without them would deploy green and then fail in every
visitor's browser — the build stops instead. Set them in your host's
environment, not just locally.

Apply `supabase/migrations/*.sql` in order to a fresh Supabase project, then set
the server secret the payment RPCs check:

```sql
insert into private.app_config (key, value) values ('server_secret', '<random>');
```

Set the same value as `SUPABASE_SERVER_SECRET`.

### Stripe (optional)

Without Stripe keys the sandbox rail handles checkout. To go live:

```
STRIPE_SECRET_KEY=sk_...
STRIPE_CONNECT_CLIENT_ID=ca_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

Point a Stripe webhook at `/api/webhooks/stripe` for `payment_intent.succeeded`,
`payment_intent.payment_failed`, `charge.refunded` and `account.updated`.

---

## Tests

```bash
npm run typecheck   # tsc, no emit
npm run lint        # eslint
npm test            # vitest — pricing, roles, validation, QR, seating, format
npm run test:e2e    # playwright — desktop + mobile
npm run verify      # all of the above plus a production build
```

`npm run test:e2e` boots a small PostgREST-shaped mock and points a real
production build at it, so the server components, the middleware and the browser
all run their real code paths without needing a live database.

Two of the unit suites exist to catch drift rather than bugs. One asserts the
authorisation ladder in `lib/roles.ts`, which every guard and action now leans
on. The other checks `lib/pricing.ts` against a transcription of the fee
arithmetic in `0006_orders_tickets_rpcs.sql`, so the total a buyer is quoted
cannot quietly diverge from the one the database will charge.

The database itself is tested separately, against a real Postgres, in
`supabase/tests/` — oversell under contention, hold expiry, promo maths, tenant
isolation, the scan state machine and the refund path.

---

## Design system

Neutral-first: paper and ink carry the page and a single accent hue carries
meaning. Hairline borders instead of shadows, one 4px spacing grid, tight
display type. Tokens live in `src/app/globals.css`; primitives in
`src/components/ui`. Light and dark are both selected, not flipped.

Chart colours are validated for colour-vision deficiency separation and contrast
against each surface rather than picked by eye.

**Mobile is a separate design, not a squeeze.** Where the phone layout differs
it is expressed with `max-sm:` / `max-lg:` variants, so the desktop stylesheet
is untouched rather than overridden. The event page reorders its columns below
`lg` so the title follows the poster instead of trailing the venue block, and
`table-stack` turns each dashboard table row into a labelled card below `sm`
rather than a 50rem sideways scroll.

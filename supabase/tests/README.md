# Database tests

These run against a real Postgres with the migrations applied — they exercise
the row locks, the RLS policies and the transactional RPCs, which is precisely
the behaviour a mocked test cannot check.

Run each file in the Supabase SQL editor (or `psql`). Every file creates a temp
table of results and ends with a `SELECT`, so a run reports pass/fail per
assertion rather than aborting on the first failure.

| File | Covers |
|------|--------|
| `01_inventory.sql` | availability maths, holds, per-order limits, oversell, hold expiry, promo maths, the full purchase path, idempotent finalisation, the server-secret gate, reserved seating |
| `02_rls.sql` | buyer/tenant/anon visibility, tenant isolation across orders, promo codes and payment accounts, self role-escalation |
| `03_checkin_refunds.sql` | the scan state machine, forged QR payloads, scan logging, undo check-in, partial and full refunds, inventory returned on refund |

They write and then roll back most of what they touch, but they are **not**
safe against production data — run them against a development project.

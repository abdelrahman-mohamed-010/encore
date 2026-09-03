-- ============================================================================
-- Tazkarti :: 0004 commerce — holds, promos, orders, tickets, scans, refunds
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Reservations: a time-boxed hold on inventory while the buyer checks out.
-- ---------------------------------------------------------------------------
create table public.reservations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  event_id    uuid not null references public.events(id) on delete cascade,
  status      public.reservation_status not null default 'active',
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now(),
  released_at timestamptz
);

create index reservations_user_idx    on public.reservations(user_id, created_at desc);
create index reservations_event_idx   on public.reservations(event_id);
create index reservations_expiry_idx  on public.reservations(expires_at) where status = 'active';

create table public.reservation_items (
  id               uuid primary key default gen_random_uuid(),
  reservation_id   uuid not null references public.reservations(id) on delete cascade,
  ticket_type_id   uuid not null references public.ticket_types(id) on delete cascade,
  event_seat_id    uuid references public.event_seats(id) on delete cascade,
  quantity         integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  -- A seated line is always exactly one seat.
  constraint reservation_items_seat_qty check (event_seat_id is null or quantity = 1)
);

create index reservation_items_reservation_idx on public.reservation_items(reservation_id);
-- Historical rows survive a released hold, so seat exclusivity is enforced by
-- event_seats.status under row lock, not by a unique index here.
create index reservation_items_seat_idx on public.reservation_items(event_seat_id) where event_seat_id is not null;

-- ---------------------------------------------------------------------------
-- Promo codes (tenant-scoped, optionally narrowed to one event/ticket types)
-- ---------------------------------------------------------------------------
create table public.promo_codes (
  id              uuid primary key default gen_random_uuid(),
  organizer_id    uuid not null references public.organizers(id) on delete cascade,
  event_id        uuid references public.events(id) on delete cascade,
  code            text not null check (length(trim(code)) between 3 and 40),
  description     text,
  discount_type   public.discount_type not null,
  -- percentage: 0-100, fixed: amount in cents
  discount_value  numeric(10,2) not null check (discount_value > 0),
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  times_redeemed  integer not null default 0 check (times_redeemed >= 0),
  min_order_cents integer not null default 0 check (min_order_cents >= 0),
  ticket_type_ids uuid[] not null default '{}',
  starts_at       timestamptz,
  ends_at         timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint promo_percentage_range check (discount_type <> 'percentage' or discount_value <= 100),
  constraint promo_window check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create unique index promo_codes_org_code_uniq on public.promo_codes(organizer_id, upper(code));
create index promo_codes_event_idx on public.promo_codes(event_id);

create trigger promo_codes_set_updated_at
  before update on public.promo_codes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  order_number   text not null unique,
  user_id        uuid references public.profiles(id) on delete set null,
  event_id       uuid not null references public.events(id) on delete restrict,
  organizer_id   uuid not null references public.organizers(id) on delete restrict,
  reservation_id uuid references public.reservations(id) on delete set null,
  promo_code_id  uuid references public.promo_codes(id) on delete set null,

  status         public.order_status not null default 'pending',

  subtotal_cents  integer not null default 0 check (subtotal_cents >= 0),
  discount_cents  integer not null default 0 check (discount_cents >= 0),
  fee_cents       integer not null default 0 check (fee_cents >= 0),
  tax_cents       integer not null default 0 check (tax_cents >= 0),
  total_cents     integer not null default 0 check (total_cents >= 0),
  refunded_cents  integer not null default 0 check (refunded_cents >= 0),
  currency        text not null default 'USD',

  buyer_name     text not null,
  buyer_email    text not null,
  buyer_phone    text,

  payment_provider   public.payment_provider not null default 'sandbox',
  payment_status     public.payment_status not null default 'requires_payment',
  payment_intent_id  text,
  connected_account_id text,
  application_fee_cents integer not null default 0 check (application_fee_cents >= 0),

  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  paid_at        timestamptz,
  cancelled_at   timestamptz,

  constraint orders_refund_within_total check (refunded_cents <= total_cents)
);

create index orders_user_idx      on public.orders(user_id, created_at desc);
create index orders_event_idx     on public.orders(event_id, created_at desc);
create index orders_organizer_idx on public.orders(organizer_id, created_at desc);
create index orders_status_idx    on public.orders(status);
create index orders_intent_idx    on public.orders(payment_intent_id) where payment_intent_id is not null;
create index orders_paid_at_idx   on public.orders(paid_at) where status = 'paid';

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create or replace function public.orders_assign_number()
returns trigger
language plpgsql
as $$
declare
  v_candidate text;
begin
  if new.order_number is not null and length(trim(new.order_number)) > 0 then
    return new;
  end if;
  loop
    v_candidate := 'TZK-' || to_char(now(), 'YYMM') || '-' || public.generate_code(6);
    exit when not exists (select 1 from public.orders where order_number = v_candidate);
  end loop;
  new.order_number := v_candidate;
  return new;
end;
$$;

create trigger orders_assign_number_trg
  before insert on public.orders
  for each row execute function public.orders_assign_number();

create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  ticket_type_id   uuid not null references public.ticket_types(id) on delete restrict,
  event_seat_id    uuid references public.event_seats(id) on delete set null,
  ticket_type_name text not null,
  seat_label       text,
  quantity         integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  subtotal_cents   integer not null check (subtotal_cents >= 0)
);

create index order_items_order_idx on public.order_items(order_id);
create index order_items_ticket_type_idx on public.order_items(ticket_type_id);

-- ---------------------------------------------------------------------------
-- Tickets — one row per admitted person, carries the QR credential
-- ---------------------------------------------------------------------------
create table public.tickets (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  order_item_id  uuid not null references public.order_items(id) on delete cascade,
  event_id       uuid not null references public.events(id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types(id) on delete restrict,
  event_seat_id  uuid references public.event_seats(id) on delete set null,
  owner_user_id  uuid references public.profiles(id) on delete set null,

  ticket_code    text not null unique,
  qr_secret      uuid not null default gen_random_uuid(),

  attendee_name  text,
  attendee_email text,
  seat_label     text,

  status         public.ticket_status not null default 'valid',
  issued_at      timestamptz not null default now(),
  checked_in_at  timestamptz,
  checked_in_by  uuid references public.profiles(id) on delete set null,
  updated_at     timestamptz not null default now()
);

create index tickets_order_idx  on public.tickets(order_id);
create index tickets_event_idx  on public.tickets(event_id, status);
create index tickets_owner_idx  on public.tickets(owner_user_id);
create unique index tickets_seat_uniq on public.tickets(event_seat_id) where event_seat_id is not null and status in ('valid', 'used');

create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

create or replace function public.tickets_assign_code()
returns trigger
language plpgsql
as $$
declare
  v_candidate text;
begin
  if new.ticket_code is not null and length(trim(new.ticket_code)) > 0 then
    return new;
  end if;
  loop
    v_candidate := public.generate_code(12);
    exit when not exists (select 1 from public.tickets where ticket_code = v_candidate);
  end loop;
  new.ticket_code := v_candidate;
  return new;
end;
$$;

create trigger tickets_assign_code_trg
  before insert on public.tickets
  for each row execute function public.tickets_assign_code();

create table public.ticket_scans (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid references public.tickets(id) on delete set null,
  event_id    uuid not null references public.events(id) on delete cascade,
  scanned_by  uuid references public.profiles(id) on delete set null,
  result      public.scan_result not null,
  scanned_code text,
  device_info text,
  scanned_at  timestamptz not null default now()
);

create index ticket_scans_event_idx  on public.ticket_scans(event_id, scanned_at desc);
create index ticket_scans_ticket_idx on public.ticket_scans(ticket_id);

-- ---------------------------------------------------------------------------
-- Refunds
-- ---------------------------------------------------------------------------
create table public.refunds (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  amount_cents      integer not null check (amount_cents > 0),
  reason            text,
  status            public.refund_status not null default 'pending',
  provider_refund_id text,
  requested_by      uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  processed_at      timestamptz
);

create index refunds_order_idx on public.refunds(order_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Engagement: favourites, reviews, waitlist, notifications, audit trail
-- ---------------------------------------------------------------------------
create table public.favorites (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  event_id   uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create index favorites_event_idx on public.favorites(event_id);

create table public.event_reviews (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index event_reviews_event_idx on public.event_reviews(event_id, created_at desc);

create trigger event_reviews_set_updated_at
  before update on public.event_reviews
  for each row execute function public.set_updated_at();

create table public.waitlist_entries (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events(id) on delete cascade,
  ticket_type_id uuid references public.ticket_types(id) on delete cascade,
  user_id        uuid references public.profiles(id) on delete cascade,
  email          text not null,
  quantity       integer not null default 1 check (quantity > 0),
  notified_at    timestamptz,
  created_at     timestamptz not null default now()
);

create unique index waitlist_unique_entry on public.waitlist_entries(event_id, coalesce(ticket_type_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(email));

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       public.notification_type not null default 'system',
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id, created_at desc);
create index notifications_unread_idx on public.notifications(user_id) where read_at is null;

create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  organizer_id uuid references public.organizers(id) on delete cascade,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index audit_logs_org_idx on public.audit_logs(organizer_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- Ownership helpers used by RLS below
-- ---------------------------------------------------------------------------
create or replace function public.owns_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.orders o
    where o.id = p_order_id
      and (o.user_id = auth.uid() or public.is_org_member(o.organizer_id, 'staff') or public.is_admin())
  );
$$;

grant execute on function public.owns_order(uuid) to authenticated, anon;

create or replace function public.owns_reservation(p_reservation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.reservations r
    where r.id = p_reservation_id and r.user_id = auth.uid()
  );
$$;

grant execute on function public.owns_reservation(uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.reservations      enable row level security;
alter table public.reservation_items enable row level security;
alter table public.promo_codes       enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.tickets           enable row level security;
alter table public.ticket_scans      enable row level security;
alter table public.refunds           enable row level security;
alter table public.favorites         enable row level security;
alter table public.event_reviews     enable row level security;
alter table public.waitlist_entries  enable row level security;
alter table public.notifications     enable row level security;
alter table public.audit_logs        enable row level security;

-- Reservations are private to the buyer (writes go through RPCs only).
create policy "buyers read their reservations"
  on public.reservations for select to authenticated
  using (user_id = auth.uid() or public.is_org_member((select organizer_id from public.events where id = event_id), 'staff'));

create policy "buyers read their reservation items"
  on public.reservation_items for select to authenticated
  using (public.owns_reservation(reservation_id));

-- Promo codes: managed by the tenant; never publicly listable (validation is
-- done through an RPC so codes cannot be enumerated).
create policy "tenant reads its promo codes"
  on public.promo_codes for select to authenticated
  using (public.is_org_member(organizer_id, 'staff') or public.is_admin());

create policy "tenant manages its promo codes"
  on public.promo_codes for all to authenticated
  using (public.is_org_member(organizer_id, 'staff') or public.is_admin())
  with check (public.is_org_member(organizer_id, 'staff') or public.is_admin());

-- Orders: buyer sees their own, tenant staff see their tenant's.
create policy "buyers and tenant read orders"
  on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_org_member(organizer_id, 'staff') or public.is_admin());

create policy "order items follow the order"
  on public.order_items for select to authenticated
  using (public.owns_order(order_id));

-- Tickets: the holder, plus tenant staff (needed for check-in and attendees).
create policy "holders and tenant read tickets"
  on public.tickets for select to authenticated
  using (
    owner_user_id = auth.uid()
    or public.owns_order(order_id)
    or public.is_org_member((select organizer_id from public.events where id = event_id), 'scanner')
    or public.is_admin()
  );

create policy "holders update their ticket attendee details"
  on public.tickets for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- Scan logs: tenant only.
create policy "tenant reads scan logs"
  on public.ticket_scans for select to authenticated
  using (public.is_org_member((select organizer_id from public.events where id = event_id), 'scanner') or public.is_admin());

-- Refunds: visible to buyer and tenant.
create policy "buyer and tenant read refunds"
  on public.refunds for select to authenticated
  using (public.owns_order(order_id));

-- Favourites: strictly personal.
create policy "users manage their favourites"
  on public.favorites for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Reviews: public read, author writes, only for events they attended.
create policy "reviews are publicly readable"
  on public.event_reviews for select using (true);

create policy "attendees write their review"
  on public.event_reviews for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.tickets t
      join public.orders o on o.id = t.order_id
      where t.event_id = event_reviews.event_id
        and o.user_id = auth.uid()
        and o.status = 'paid'
    )
  );

create policy "authors edit their review"
  on public.event_reviews for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "authors delete their review"
  on public.event_reviews for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Waitlist.
create policy "users read their waitlist entries"
  on public.waitlist_entries for select to authenticated
  using (user_id = auth.uid() or public.is_org_member((select organizer_id from public.events where id = event_id), 'staff') or public.is_admin());

create policy "users join the waitlist"
  on public.waitlist_entries for insert to authenticated
  with check (user_id = auth.uid());

create policy "users leave the waitlist"
  on public.waitlist_entries for delete to authenticated
  using (user_id = auth.uid() or public.is_org_member((select organizer_id from public.events where id = event_id), 'staff'));

-- Notifications: strictly personal.
create policy "users read their notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

create policy "users mark their notifications read"
  on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users delete their notifications"
  on public.notifications for delete to authenticated
  using (user_id = auth.uid());

-- Audit trail: tenant staff and admins.
create policy "tenant reads its audit log"
  on public.audit_logs for select to authenticated
  using ((organizer_id is not null and public.is_org_member(organizer_id, 'admin')) or public.is_admin());

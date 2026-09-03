-- ============================================================================
-- Tazkarti :: 0006 order lifecycle, ticket issuance, check-in, refunds
-- ============================================================================

-- Human readable seat label, e.g. "Orchestra · Row C · Seat 12".
create or replace function public.seat_label(p_event_seat_id uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select concat_ws(' · ', sec.name, 'Row ' || vs.row_label, 'Seat ' || vs.seat_number)
    from public.event_seats es
    join public.venue_seats vs on vs.id = es.seat_id
    join public.venue_sections sec on sec.id = vs.section_id
   where es.id = p_event_seat_id;
$$;

grant execute on function public.seat_label(uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Turn an active hold into a pending order. Money is not moved here; this only
-- computes and freezes the amounts the payment provider will charge.
-- ---------------------------------------------------------------------------
create or replace function public.create_order_from_reservation(
  p_reservation_id uuid,
  p_buyer_name     text,
  p_buyer_email    text,
  p_buyer_phone    text default null,
  p_promo_code     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user_id     uuid := auth.uid();
  v_reservation public.reservations;
  v_event       public.events;
  v_settings    public.platform_settings;
  v_currency    text;
  v_subtotal    integer;
  v_discount    integer := 0;
  v_promo       jsonb;
  v_promo_id    uuid;
  v_fee         integer;
  v_total       integer;
  v_order_id    uuid;
  v_existing    public.orders;
  v_provider    public.payment_provider;
begin
  if v_user_id is null then
    raise exception 'you must be signed in to check out' using errcode = '42501';
  end if;

  select * into v_reservation from public.reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'reservation not found' using errcode = 'P0002';
  end if;
  if v_reservation.user_id <> v_user_id then
    raise exception 'this reservation belongs to someone else' using errcode = '42501';
  end if;
  if v_reservation.status <> 'active' then
    raise exception 'this reservation is no longer active' using errcode = 'P0001', hint = 'hold_expired';
  end if;
  if v_reservation.expires_at < now() then
    perform public.release_reservation_internal(v_reservation.id, 'expired');
    raise exception 'your ticket hold expired, please select your tickets again'
      using errcode = 'P0001', hint = 'hold_expired';
  end if;

  -- Re-use the pending order if the buyer refreshes the checkout page.
  select * into v_existing
    from public.orders
   where reservation_id = p_reservation_id and status = 'pending'
   limit 1;

  select * into v_event from public.events where id = v_reservation.event_id;
  select * into v_settings from public.platform_settings where id;

  select coalesce(min(tt.currency), v_settings.default_currency) into v_currency
    from public.reservation_items ri
    join public.ticket_types tt on tt.id = ri.ticket_type_id
   where ri.reservation_id = p_reservation_id;

  select coalesce(sum(unit_price_cents * quantity), 0)::int into v_subtotal
    from public.reservation_items where reservation_id = p_reservation_id;

  if p_promo_code is not null and length(trim(p_promo_code)) > 0 then
    v_promo := public.validate_promo_code(v_reservation.event_id, p_promo_code, v_subtotal);
    if (v_promo ->> 'valid')::boolean then
      v_discount := (v_promo ->> 'discount_cents')::int;
      v_promo_id := (v_promo ->> 'promo_code_id')::uuid;
    else
      raise exception '%', coalesce(v_promo ->> 'message', 'Invalid promo code') using errcode = 'P0001';
    end if;
  end if;

  -- Platform service fee, charged on top of the discounted subtotal. Free
  -- orders stay free: no fee is added when nothing is being paid.
  if (v_subtotal - v_discount) > 0 then
    v_fee := floor((v_subtotal - v_discount) * v_settings.platform_fee_percent / 100.0)::int
             + v_settings.platform_fee_fixed_cents;
  else
    v_fee := 0;
  end if;

  v_total := greatest(0, v_subtotal - v_discount + v_fee);

  v_provider := case
    when v_total = 0 then 'sandbox'
    when public.organizer_can_sell(v_event.organizer_id) then 'stripe'
    else 'sandbox'
  end;

  if v_existing.id is not null then
    update public.orders
       set subtotal_cents = v_subtotal,
           discount_cents = v_discount,
           fee_cents      = v_fee,
           total_cents    = v_total,
           currency       = v_currency,
           promo_code_id  = v_promo_id,
           buyer_name     = p_buyer_name,
           buyer_email    = lower(trim(p_buyer_email)),
           buyer_phone    = p_buyer_phone,
           payment_provider = v_provider,
           application_fee_cents = v_fee
     where id = v_existing.id
     returning id into v_order_id;
  else
    insert into public.orders (
      user_id, event_id, organizer_id, reservation_id, promo_code_id,
      subtotal_cents, discount_cents, fee_cents, total_cents, currency,
      buyer_name, buyer_email, buyer_phone,
      payment_provider, application_fee_cents
    ) values (
      v_user_id, v_reservation.event_id, v_event.organizer_id, p_reservation_id, v_promo_id,
      v_subtotal, v_discount, v_fee, v_total, v_currency,
      p_buyer_name, lower(trim(p_buyer_email)), p_buyer_phone,
      v_provider, v_fee
    )
    returning id into v_order_id;
  end if;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', (select order_number from public.orders where id = v_order_id),
    'subtotal_cents', v_subtotal,
    'discount_cents', v_discount,
    'fee_cents', v_fee,
    'total_cents', v_total,
    'currency', v_currency,
    'provider', v_provider,
    'expires_at', v_reservation.expires_at
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- finalize_order_payment: the only path that converts held stock into sold
-- stock and mints tickets. Gated by the server secret because the caller has
-- already verified the payment with the provider; a browser must never be able
-- to reach it. Idempotent — replayed webhooks are a no-op.
-- ---------------------------------------------------------------------------
create or replace function public.finalize_order_payment(
  p_order_id          uuid,
  p_payment_intent_id text,
  p_secret            text,
  p_connected_account text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_order       public.orders;
  v_reservation public.reservations;
  v_item        record;
  v_order_item_id uuid;
  v_label       text;
  v_ticket_count integer := 0;
  i integer;
begin
  perform private.verify_server_secret(p_secret);

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;

  if v_order.status = 'paid' then
    return jsonb_build_object(
      'order_id', v_order.id, 'status', 'paid', 'already_finalized', true,
      'ticket_count', (select count(*) from public.tickets where order_id = v_order.id)
    );
  end if;
  if v_order.status <> 'pending' then
    raise exception 'order is % and cannot be paid', v_order.status using errcode = 'P0001';
  end if;

  select * into v_reservation from public.reservations where id = v_order.reservation_id for update;
  if not found then
    raise exception 'the ticket hold for this order no longer exists' using errcode = 'P0001', hint = 'hold_expired';
  end if;
  if v_reservation.status = 'active' and v_reservation.expires_at < now() then
    perform public.release_reservation_internal(v_reservation.id, 'expired');
    update public.orders set status = 'failed', payment_status = 'failed' where id = p_order_id;
    raise exception 'the ticket hold expired before payment completed'
      using errcode = 'P0001', hint = 'hold_expired';
  end if;
  if v_reservation.status <> 'active' then
    raise exception 'the ticket hold for this order is no longer active' using errcode = 'P0001', hint = 'hold_expired';
  end if;

  -- Move inventory from reserved to sold, then materialise line items+tickets.
  for v_item in
    select ri.id, ri.ticket_type_id, ri.event_seat_id, ri.quantity, ri.unit_price_cents,
           tt.name as ticket_type_name
      from public.reservation_items ri
      join public.ticket_types tt on tt.id = ri.ticket_type_id
     where ri.reservation_id = v_reservation.id
     order by ri.id
  loop
    update public.ticket_types
       set quantity_reserved = greatest(0, quantity_reserved - v_item.quantity),
           quantity_sold     = quantity_sold + v_item.quantity
     where id = v_item.ticket_type_id;

    v_label := null;
    if v_item.event_seat_id is not null then
      update public.event_seats
         set status = 'sold', held_until = null
       where id = v_item.event_seat_id;
      v_label := public.seat_label(v_item.event_seat_id);
    end if;

    insert into public.order_items (
      order_id, ticket_type_id, event_seat_id, ticket_type_name, seat_label,
      quantity, unit_price_cents, subtotal_cents
    ) values (
      v_order.id, v_item.ticket_type_id, v_item.event_seat_id, v_item.ticket_type_name, v_label,
      v_item.quantity, v_item.unit_price_cents, v_item.unit_price_cents * v_item.quantity
    )
    returning id into v_order_item_id;

    for i in 1..v_item.quantity loop
      insert into public.tickets (
        order_id, order_item_id, event_id, ticket_type_id, event_seat_id,
        owner_user_id, attendee_name, attendee_email, seat_label
      ) values (
        v_order.id, v_order_item_id, v_order.event_id, v_item.ticket_type_id, v_item.event_seat_id,
        v_order.user_id, v_order.buyer_name, v_order.buyer_email, v_label
      );
      v_ticket_count := v_ticket_count + 1;
    end loop;
  end loop;

  update public.reservations set status = 'converted' where id = v_reservation.id;

  if v_order.promo_code_id is not null then
    update public.promo_codes
       set times_redeemed = times_redeemed + 1
     where id = v_order.promo_code_id;
  end if;

  update public.orders
     set status = 'paid',
         payment_status = 'succeeded',
         payment_intent_id = coalesce(p_payment_intent_id, payment_intent_id),
         connected_account_id = coalesce(p_connected_account, connected_account_id),
         paid_at = now()
   where id = p_order_id;

  if v_order.user_id is not null then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      v_order.user_id, 'order_confirmed',
      'Your tickets are confirmed',
      format('Order %s · %s ticket(s)', v_order.order_number, v_ticket_count),
      '/account/orders/' || v_order.id
    );
  end if;

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'status', 'paid',
    'already_finalized', false,
    'ticket_count', v_ticket_count
  );
end;
$$;

-- Payment failed or was abandoned: release the hold and close the order.
create or replace function public.fail_order_payment(
  p_order_id uuid,
  p_reason   text,
  p_secret   text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_order public.orders;
begin
  perform private.verify_server_secret(p_secret);

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;
  if v_order.status <> 'pending' then
    return jsonb_build_object('order_id', v_order.id, 'status', v_order.status, 'changed', false);
  end if;

  if v_order.reservation_id is not null then
    perform public.release_reservation_internal(v_order.reservation_id, 'released');
  end if;

  update public.orders
     set status = 'failed',
         payment_status = 'failed',
         metadata = metadata || jsonb_build_object('failure_reason', p_reason)
   where id = p_order_id;

  return jsonb_build_object('order_id', v_order.id, 'status', 'failed', 'changed', true);
end;
$$;

-- Buyer or organizer abandons a pending order before paying.
create or replace function public.cancel_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;
  if not (v_order.user_id = auth.uid()
          or public.is_org_member(v_order.organizer_id, 'staff')
          or public.is_admin()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'only pending orders can be cancelled' using errcode = 'P0001';
  end if;

  if v_order.reservation_id is not null then
    perform public.release_reservation_internal(v_order.reservation_id, 'released');
  end if;

  update public.orders
     set status = 'cancelled', cancelled_at = now()
   where id = p_order_id;

  return jsonb_build_object('order_id', p_order_id, 'status', 'cancelled');
end;
$$;

-- ---------------------------------------------------------------------------
-- Check-in. Every attempt is logged, valid or not.
-- ---------------------------------------------------------------------------
create or replace function public.scan_ticket(
  p_ticket_code text,
  p_qr_secret   uuid,
  p_event_id    uuid,
  p_device_info text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_ticket public.tickets;
  v_result public.scan_result;
  v_event  public.events;
begin
  select * into v_event from public.events where id = p_event_id;
  if not found then
    raise exception 'event not found' using errcode = 'P0002';
  end if;
  if not (public.is_org_member(v_event.organizer_id, 'scanner') or public.is_admin()) then
    raise exception 'you are not allowed to scan tickets for this event' using errcode = '42501';
  end if;

  select * into v_ticket
    from public.tickets
   where ticket_code = upper(trim(p_ticket_code))
   for update;

  if not found or v_ticket.qr_secret is distinct from p_qr_secret then
    v_result := 'not_found';
  elsif v_ticket.event_id <> p_event_id then
    v_result := 'wrong_event';
  elsif v_ticket.status in ('void', 'refunded') then
    v_result := 'void';
  elsif v_ticket.status = 'used' then
    v_result := 'already_used';
  else
    v_result := 'valid';
    update public.tickets
       set status = 'used', checked_in_at = now(), checked_in_by = auth.uid()
     where id = v_ticket.id;
  end if;

  insert into public.ticket_scans (ticket_id, event_id, scanned_by, result, scanned_code, device_info)
  values (
    case when v_result = 'not_found' then null else v_ticket.id end,
    p_event_id, auth.uid(), v_result, upper(trim(p_ticket_code)), p_device_info
  );

  return jsonb_build_object(
    'result', v_result,
    'ticket_code', upper(trim(p_ticket_code)),
    'attendee_name', case when v_result = 'not_found' then null else v_ticket.attendee_name end,
    'ticket_type', (select name from public.ticket_types where id = v_ticket.ticket_type_id),
    'seat_label', v_ticket.seat_label,
    'checked_in_at', case when v_result = 'valid' then now() else v_ticket.checked_in_at end
  );
end;
$$;

-- Undo an accidental check-in.
create or replace function public.undo_check_in(p_ticket_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_ticket public.tickets;
begin
  select * into v_ticket from public.tickets where id = p_ticket_id for update;
  if not found then
    raise exception 'ticket not found' using errcode = 'P0002';
  end if;
  if not (public.is_org_member((select organizer_id from public.events where id = v_ticket.event_id), 'staff')
          or public.is_admin()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if v_ticket.status <> 'used' then
    raise exception 'this ticket is not checked in' using errcode = 'P0001';
  end if;

  update public.tickets
     set status = 'valid', checked_in_at = null, checked_in_by = null
   where id = p_ticket_id;

  return jsonb_build_object('ticket_id', p_ticket_id, 'status', 'valid');
end;
$$;

-- ---------------------------------------------------------------------------
-- Refunds. Called by the server after the provider confirms the money moved.
-- A full refund voids the tickets and returns seats/stock to the pool.
-- ---------------------------------------------------------------------------
create or replace function public.record_refund(
  p_order_id     uuid,
  p_amount_cents integer,
  p_reason       text,
  p_refund_id    text,
  p_secret       text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_order       public.orders;
  v_new_total   integer;
  v_is_full     boolean;
  v_item        record;
begin
  perform private.verify_server_secret(p_secret);

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;
  if v_order.status not in ('paid', 'partially_refunded') then
    raise exception 'only paid orders can be refunded' using errcode = 'P0001';
  end if;
  if p_amount_cents <= 0 then
    raise exception 'refund amount must be positive' using errcode = '22023';
  end if;

  v_new_total := v_order.refunded_cents + p_amount_cents;
  if v_new_total > v_order.total_cents then
    raise exception 'refund exceeds the order total' using errcode = 'P0001';
  end if;
  v_is_full := v_new_total >= v_order.total_cents;

  insert into public.refunds (order_id, amount_cents, reason, status, provider_refund_id, requested_by, processed_at)
  values (p_order_id, p_amount_cents, p_reason, 'succeeded', p_refund_id, auth.uid(), now());

  if v_is_full then
    -- Void unused tickets and hand the inventory back.
    for v_item in
      select ticket_type_id, count(*)::int as qty
        from public.tickets
       where order_id = p_order_id and status in ('valid', 'used')
       group by ticket_type_id
       order by ticket_type_id
    loop
      update public.ticket_types
         set quantity_sold = greatest(0, quantity_sold - v_item.qty)
       where id = v_item.ticket_type_id;
    end loop;

    update public.event_seats es
       set status = 'available', held_until = null
      from public.tickets t
     where t.order_id = p_order_id
       and t.event_seat_id = es.id
       and es.status = 'sold';

    update public.tickets
       set status = 'refunded'
     where order_id = p_order_id and status in ('valid', 'used');
  end if;

  update public.orders
     set refunded_cents = v_new_total,
         status = case when v_is_full then 'refunded'::public.order_status
                       else 'partially_refunded'::public.order_status end,
         payment_status = case when v_is_full then 'refunded'::public.payment_status
                               else payment_status end
   where id = p_order_id;

  if v_order.user_id is not null then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      v_order.user_id, 'order_refunded',
      case when v_is_full then 'Your order was refunded' else 'A partial refund was issued' end,
      format('Order %s · %s refunded', v_order.order_number,
             to_char(p_amount_cents / 100.0, 'FM999999990.00')),
      '/account/orders/' || v_order.id
    );
  end if;

  return jsonb_build_object(
    'order_id', p_order_id,
    'refunded_cents', v_new_total,
    'full_refund', v_is_full
  );
end;
$$;

-- Webhook-driven sync of a connected Stripe account's capabilities.
create or replace function public.sync_payment_account(
  p_stripe_account_id text,
  p_charges_enabled   boolean,
  p_payouts_enabled   boolean,
  p_details_submitted boolean,
  p_requirements      jsonb,
  p_secret            text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_id uuid;
begin
  perform private.verify_server_secret(p_secret);

  update public.payment_accounts
     set charges_enabled   = coalesce(p_charges_enabled, charges_enabled),
         payouts_enabled   = coalesce(p_payouts_enabled, payouts_enabled),
         details_submitted = coalesce(p_details_submitted, details_submitted),
         requirements_due  = coalesce(p_requirements, requirements_due)
   where stripe_account_id = p_stripe_account_id
   returning id into v_id;

  return jsonb_build_object('updated', v_id is not null, 'payment_account_id', v_id);
end;
$$;

grant execute on function public.create_order_from_reservation(uuid, text, text, text, text) to authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;
grant execute on function public.scan_ticket(text, uuid, uuid, text) to authenticated;
grant execute on function public.undo_check_in(uuid) to authenticated;
-- Secret-gated RPCs: reachable only from trusted server routes.
grant execute on function public.finalize_order_payment(uuid, text, text, text) to authenticated, anon;
grant execute on function public.fail_order_payment(uuid, text, text) to authenticated, anon;
grant execute on function public.record_refund(uuid, integer, text, text, text) to authenticated, anon;
grant execute on function public.sync_payment_account(text, boolean, boolean, boolean, jsonb, text) to authenticated, anon;

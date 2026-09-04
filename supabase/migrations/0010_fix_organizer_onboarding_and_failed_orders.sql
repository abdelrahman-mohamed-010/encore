-- 0010_fix_organizer_onboarding_and_failed_orders
--
-- Two production bugs found on the live site:
--
-- 1. Creating the first organization from a brand-new account failed with
--    "role can only be changed by an administrator". `handle_new_organizer`
--    promotes the owner's profile from 'attendee' to 'organizer', but the
--    privileged-column guard rejected every self-initiated role change, so the
--    whole onboarding transaction rolled back.
--
-- 2. Paying against an expired hold left the order stuck in 'pending' forever.
--    `finalize_order_payment` UPDATEd the order to 'failed' and then RAISEd,
--    which rolled back its own write. The caller saw an error, the row never
--    changed, and the order could never be retried or cleaned up.

-- ---------------------------------------------------------------------------
-- 1. Allow the attendee -> organizer self-promotion, but only when the profile
--    actually owns an organizer row. Everything else stays admin-only.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  -- No JWT means a trusted server context (migrations, service role); RLS has
  -- already refused anonymous and non-owner updates before reaching here.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.is_banned is distinct from old.is_banned then
    raise exception 'ban status can only be changed by an administrator' using errcode = '42501';
  end if;

  if new.role is distinct from old.role then
    if not (
      old.role = 'attendee'
      and new.role = 'organizer'
      and exists (select 1 from public.organizers o where o.owner_id = new.id)
    ) then
      raise exception 'role can only be changed by an administrator' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Return a failure result instead of raising, so the 'failed' write commits.
-- ---------------------------------------------------------------------------
create or replace function public.finalize_order_payment(
  p_order_id uuid,
  p_payment_intent_id text,
  p_secret text,
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

  -- The hold is gone or timed out: fail the order and RETURN, so this write
  -- survives. Raising here would roll it back and leave the order pending.
  if not found
     or v_reservation.status <> 'active'
     or v_reservation.expires_at < now() then

    if found and v_reservation.status = 'active' then
      perform public.release_reservation_internal(v_reservation.id, 'expired');
    end if;

    update public.orders
       set status = 'failed',
           payment_status = 'failed',
           metadata = metadata || jsonb_build_object('failure_reason', 'the ticket hold expired before payment completed')
     where id = p_order_id;

    return jsonb_build_object(
      'order_id', p_order_id,
      'status', 'failed',
      'error', 'hold_expired',
      'message', 'The ticket hold expired before payment completed.'
    );
  end if;

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

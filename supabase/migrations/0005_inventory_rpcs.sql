-- ============================================================================
-- Tazkarti :: 0005 inventory RPCs — holds, expiry, promo validation, orders
--
-- Every mutation that touches inventory happens here, inside a single
-- transaction with row locks taken in a deterministic order (always by id).
-- The tables themselves grant no INSERT/UPDATE to clients, so overselling is
-- impossible through the API surface, and the CHECK constraint on
-- ticket_types is the last line of defence if any of this is ever wrong.
-- ============================================================================

-- Shared release path: returns inventory to the pool and marks the hold.
create or replace function public.release_reservation_internal(
  p_reservation_id uuid,
  p_status public.reservation_status
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_item record;
begin
  -- Give back general-admission quantity, type by type, in a stable order.
  for v_item in
    select ri.ticket_type_id, sum(ri.quantity)::int as qty
      from public.reservation_items ri
     where ri.reservation_id = p_reservation_id
     group by ri.ticket_type_id
     order by ri.ticket_type_id
  loop
    update public.ticket_types
       set quantity_reserved = greatest(0, quantity_reserved - v_item.qty)
     where id = v_item.ticket_type_id;
  end loop;

  -- Free any seats still held by this reservation (never touch sold seats).
  update public.event_seats es
     set status = 'available', held_until = null
    from public.reservation_items ri
   where ri.reservation_id = p_reservation_id
     and ri.event_seat_id = es.id
     and es.status = 'held';

  update public.reservations
     set status = p_status,
         released_at = now()
   where id = p_reservation_id
     and status = 'active';
end;
$$;

revoke all on function public.release_reservation_internal(uuid, public.reservation_status) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Release every hold that has timed out. Idempotent and safe to call from
-- anywhere: it only ever touches reservations whose expires_at has passed.
-- ---------------------------------------------------------------------------
create or replace function public.expire_reservations(p_event_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_reservation record;
  v_count integer := 0;
begin
  for v_reservation in
    select id
      from public.reservations
     where status = 'active'
       and expires_at < now()
       and (p_event_id is null or event_id = p_event_id)
     order by id
     for update skip locked
  loop
    perform public.release_reservation_internal(v_reservation.id, 'expired');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;


-- ---------------------------------------------------------------------------
-- create_reservation: take a time-boxed hold on inventory.
--   p_items    [{"ticket_type_id": uuid, "quantity": int}, ...]  (general admission)
--   p_seat_ids [event_seat_id, ...]                              (reserved seating)
-- ---------------------------------------------------------------------------
create or replace function public.create_reservation(
  p_event_id uuid,
  p_items    jsonb default '[]'::jsonb,
  p_seat_ids uuid[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user_id        uuid := auth.uid();
  v_event          public.events;
  v_hold_minutes   integer;
  v_expires_at     timestamptz;
  v_reservation_id uuid;
  v_item           record;
  v_type           public.ticket_types;
  v_seat           record;
  v_available      integer;
  v_total_qty      integer := 0;
  v_seat_count     integer := coalesce(array_length(p_seat_ids, 1), 0);
begin
  if v_user_id is null then
    raise exception 'you must be signed in to reserve tickets' using errcode = '42501';
  end if;
  if not public.is_active_user() then
    raise exception 'this account is not allowed to purchase tickets' using errcode = '42501';
  end if;

  -- Clear anything that has already timed out so freed stock is visible here.
  perform public.expire_reservations(p_event_id);

  select * into v_event from public.events where id = p_event_id for update;
  if not found then
    raise exception 'event not found' using errcode = 'P0002';
  end if;
  if v_event.status <> 'published' then
    raise exception 'tickets for this event are not on sale' using errcode = 'P0001';
  end if;
  if v_event.sales_start_at is not null and now() < v_event.sales_start_at then
    raise exception 'ticket sales have not started yet' using errcode = 'P0001';
  end if;
  if v_event.sales_end_at is not null and now() > v_event.sales_end_at then
    raise exception 'ticket sales for this event have closed' using errcode = 'P0001';
  end if;
  if v_event.ends_at < now() then
    raise exception 'this event has already finished' using errcode = 'P0001';
  end if;

  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then
    raise exception 'items must be a json array' using errcode = '22023';
  end if;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 and v_seat_count = 0 then
    raise exception 'select at least one ticket' using errcode = 'P0001';
  end if;

  -- One active hold per buyer per event; re-entering checkout replaces it.
  perform public.release_reservation_internal(r.id, 'released')
     from public.reservations r
    where r.user_id = v_user_id and r.event_id = p_event_id and r.status = 'active';

  select hold_duration_minutes into v_hold_minutes from public.platform_settings where id;
  v_expires_at := now() + make_interval(mins => coalesce(v_hold_minutes, 10));

  insert into public.reservations (user_id, event_id, expires_at)
  values (v_user_id, p_event_id, v_expires_at)
  returning id into v_reservation_id;

  -- ---- General admission -------------------------------------------------
  for v_item in
    select (elem ->> 'ticket_type_id')::uuid as ticket_type_id,
           (elem ->> 'quantity')::int        as quantity
      from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as elem
     order by 1
  loop
    if v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'quantity must be a positive number' using errcode = '22023';
    end if;

    select * into v_type from public.ticket_types where id = v_item.ticket_type_id for update;
    if not found then
      raise exception 'ticket type not found' using errcode = 'P0002';
    end if;
    if v_type.event_id <> p_event_id then
      raise exception 'ticket type does not belong to this event' using errcode = 'P0001';
    end if;
    if v_type.is_hidden then
      raise exception 'ticket type % is not available', v_type.name using errcode = 'P0001';
    end if;
    if v_type.sales_start_at is not null and now() < v_type.sales_start_at then
      raise exception 'sales for % have not started yet', v_type.name using errcode = 'P0001';
    end if;
    if v_type.sales_end_at is not null and now() > v_type.sales_end_at then
      raise exception 'sales for % have closed', v_type.name using errcode = 'P0001';
    end if;
    if v_item.quantity < v_type.min_per_order then
      raise exception 'minimum % ticket(s) per order for %', v_type.min_per_order, v_type.name using errcode = 'P0001';
    end if;
    if v_item.quantity > v_type.max_per_order then
      raise exception 'maximum % ticket(s) per order for %', v_type.max_per_order, v_type.name using errcode = 'P0001';
    end if;

    v_available := v_type.quantity_total - v_type.quantity_reserved - v_type.quantity_sold;
    if v_available < v_item.quantity then
      raise exception 'only % ticket(s) left for %', greatest(v_available, 0), v_type.name
        using errcode = 'P0001', hint = 'sold_out';
    end if;

    update public.ticket_types
       set quantity_reserved = quantity_reserved + v_item.quantity
     where id = v_type.id;

    insert into public.reservation_items (reservation_id, ticket_type_id, quantity, unit_price_cents)
    values (v_reservation_id, v_type.id, v_item.quantity, v_type.price_cents);

    v_total_qty := v_total_qty + v_item.quantity;
  end loop;

  -- ---- Reserved seating --------------------------------------------------
  if v_seat_count > 0 then
    for v_seat in
      select es.id, es.status, es.ticket_type_id, es.price_cents, es.event_id
        from public.event_seats es
       where es.id = any(p_seat_ids)
       order by es.id
       for update
    loop
      if v_seat.event_id <> p_event_id then
        raise exception 'seat does not belong to this event' using errcode = 'P0001';
      end if;
      if v_seat.status <> 'available' then
        raise exception 'one of the selected seats is no longer available'
          using errcode = 'P0001', hint = 'seat_taken';
      end if;
      if v_seat.ticket_type_id is null then
        raise exception 'seat is not assigned to a ticket type' using errcode = 'P0001';
      end if;

      select * into v_type from public.ticket_types where id = v_seat.ticket_type_id for update;
      if not found then
        raise exception 'ticket type not found for seat' using errcode = 'P0002';
      end if;

      v_available := v_type.quantity_total - v_type.quantity_reserved - v_type.quantity_sold;
      if v_available < 1 then
        raise exception 'no allocation left for %', v_type.name using errcode = 'P0001', hint = 'sold_out';
      end if;

      update public.event_seats
         set status = 'held', held_until = v_expires_at
       where id = v_seat.id;

      update public.ticket_types
         set quantity_reserved = quantity_reserved + 1
       where id = v_type.id;

      insert into public.reservation_items
        (reservation_id, ticket_type_id, event_seat_id, quantity, unit_price_cents)
      values
        (v_reservation_id, v_type.id, v_seat.id, 1, coalesce(v_seat.price_cents, v_type.price_cents));

      v_total_qty := v_total_qty + 1;
    end loop;

    -- Every requested seat must have been locked; a missing id means it was
    -- never part of this event.
    if (select count(*) from public.reservation_items
         where reservation_id = v_reservation_id and event_seat_id is not null) <> v_seat_count then
      raise exception 'one or more seats could not be reserved' using errcode = 'P0001', hint = 'seat_taken';
    end if;
  end if;

  if v_total_qty = 0 then
    raise exception 'select at least one ticket' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'reservation_id', v_reservation_id,
    'expires_at', v_expires_at,
    'quantity', v_total_qty,
    'subtotal_cents', (
      select coalesce(sum(unit_price_cents * quantity), 0)
        from public.reservation_items where reservation_id = v_reservation_id
    )
  );
end;
$$;

-- Buyer-initiated release (leaving checkout).
create or replace function public.release_reservation(p_reservation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if not exists (
    select 1 from public.reservations
     where id = p_reservation_id and user_id = auth.uid()
  ) then
    raise exception 'reservation not found' using errcode = 'P0002';
  end if;
  perform public.release_reservation_internal(p_reservation_id, 'released');
end;
$$;

-- ---------------------------------------------------------------------------
-- Promo code validation. Kept as an RPC so codes are never enumerable.
-- ---------------------------------------------------------------------------
create or replace function public.validate_promo_code(
  p_event_id       uuid,
  p_code           text,
  p_subtotal_cents integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_event public.events;
  v_promo public.promo_codes;
  v_discount integer;
begin
  if p_code is null or length(trim(p_code)) = 0 then
    return jsonb_build_object('valid', false, 'message', 'Enter a promo code.');
  end if;

  select * into v_event from public.events where id = p_event_id;
  if not found then
    return jsonb_build_object('valid', false, 'message', 'Event not found.');
  end if;

  select * into v_promo
    from public.promo_codes
   where organizer_id = v_event.organizer_id
     and upper(code) = upper(trim(p_code))
     and (event_id is null or event_id = p_event_id);

  if not found then
    return jsonb_build_object('valid', false, 'message', 'That promo code is not valid for this event.');
  end if;
  if not v_promo.is_active then
    return jsonb_build_object('valid', false, 'message', 'This promo code is no longer active.');
  end if;
  if v_promo.starts_at is not null and now() < v_promo.starts_at then
    return jsonb_build_object('valid', false, 'message', 'This promo code is not active yet.');
  end if;
  if v_promo.ends_at is not null and now() > v_promo.ends_at then
    return jsonb_build_object('valid', false, 'message', 'This promo code has expired.');
  end if;
  if v_promo.max_redemptions is not null and v_promo.times_redeemed >= v_promo.max_redemptions then
    return jsonb_build_object('valid', false, 'message', 'This promo code has been fully redeemed.');
  end if;
  if coalesce(p_subtotal_cents, 0) < v_promo.min_order_cents then
    return jsonb_build_object(
      'valid', false,
      'message', format('Spend at least %s to use this code.', to_char(v_promo.min_order_cents / 100.0, 'FM999999990.00'))
    );
  end if;

  if v_promo.discount_type = 'percentage' then
    v_discount := floor(coalesce(p_subtotal_cents, 0) * v_promo.discount_value / 100.0)::int;
  else
    v_discount := round(v_promo.discount_value)::int;
  end if;
  v_discount := least(greatest(v_discount, 0), coalesce(p_subtotal_cents, 0));

  return jsonb_build_object(
    'valid', true,
    'promo_code_id', v_promo.id,
    'code', v_promo.code,
    'discount_cents', v_discount,
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value
  );
end;
$$;

grant execute on function public.expire_reservations(uuid) to authenticated, anon;
grant execute on function public.create_reservation(uuid, jsonb, uuid[]) to authenticated;
grant execute on function public.release_reservation(uuid) to authenticated;
grant execute on function public.validate_promo_code(uuid, text, integer) to authenticated, anon;

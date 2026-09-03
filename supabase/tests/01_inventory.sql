-- ============================================================================
-- Inventory, holds, promos and the purchase path.
-- Replace :secret with the value stored in private.app_config.server_secret.
-- ============================================================================
create temp table t_results(seq serial, name text, passed boolean, detail text);

do $$
declare
  v_buyer   uuid := (select id from auth.users where email = 'demo@tazkarti.app');
  v_other   uuid := (select id from auth.users where email = 'cairolive@tazkarti.app');
  v_event   uuid := (select id from public.events where slug = 'al-kaseh-comedy-night');
  v_seated  uuid := (select id from public.events where slug = 'aida-opening-night');
  v_tt uuid; v_res jsonb; v_order jsonb; v_fin jsonb;
  v_seat uuid; v_code text; v_label text;
  v_n int; v_before int; v_after int;
  v_secret constant text := current_setting('tazkarti.server_secret', true);
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_buyer, 'role', 'authenticated')::text, true);

  select id into v_tt from public.ticket_types
   where event_id = v_event and name = 'Early Bird';
  select quantity_total - quantity_reserved - quantity_sold
    into v_before from public.ticket_types where id = v_tt;

  -- A hold moves stock from available into reserved.
  v_res := public.create_reservation(v_event,
    jsonb_build_array(jsonb_build_object('ticket_type_id', v_tt, 'quantity', 4)));
  select quantity_reserved into v_after from public.ticket_types where id = v_tt;
  insert into t_results(name, passed, detail)
  values ('a hold reserves the requested tickets', v_after = 4, format('reserved=%s', v_after));

  -- The per-order maximum is enforced.
  begin
    perform public.create_reservation(v_event,
      jsonb_build_array(jsonb_build_object('ticket_type_id', v_tt, 'quantity', 99)));
    insert into t_results(name, passed, detail) values ('max_per_order enforced', false, 'no error');
  exception when others then
    insert into t_results(name, passed, detail)
    values ('max_per_order enforced', sqlerrm like '%maximum%', sqlerrm);
  end;

  -- Re-entering checkout replaces the previous hold instead of stacking one.
  perform public.create_reservation(v_event,
    jsonb_build_array(jsonb_build_object('ticket_type_id', v_tt, 'quantity', 2)));
  select quantity_reserved into v_after from public.ticket_types where id = v_tt;
  select count(*) into v_n from public.reservations
   where user_id = v_buyer and event_id = v_event and status = 'active';
  insert into t_results(name, passed, detail)
  values ('re-holding replaces the previous hold', v_after = 2 and v_n = 1,
          format('reserved=%s active=%s', v_after, v_n));

  -- Overselling is impossible: shrink capacity to exactly what is held, then
  -- have a second buyer try to take more.
  begin
    perform public.create_reservation(v_event,
      jsonb_build_array(jsonb_build_object('ticket_type_id', v_tt, 'quantity', 6)));
    update public.ticket_types set quantity_total = 8 where id = v_tt;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
    perform public.create_reservation(v_event,
      jsonb_build_array(jsonb_build_object('ticket_type_id', v_tt, 'quantity', 3)));
    insert into t_results(name, passed, detail)
    values ('oversell blocked', false, 'a hold succeeded past capacity');
  exception when others then
    insert into t_results(name, passed, detail)
    values ('oversell blocked', sqlerrm like '%left for%', sqlerrm);
  end;
  update public.ticket_types set quantity_total = v_before where id = v_tt;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_buyer, 'role', 'authenticated')::text, true);

  -- An expired hold returns its stock to the pool.
  v_res := public.create_reservation(v_event,
    jsonb_build_array(jsonb_build_object('ticket_type_id', v_tt, 'quantity', 5)));
  update public.reservations set expires_at = now() - interval '1 minute'
   where id = (v_res->>'reservation_id')::uuid;
  perform public.expire_reservations(v_event);
  select quantity_reserved into v_after from public.ticket_types where id = v_tt;
  select status into v_code from public.reservations where id = (v_res->>'reservation_id')::uuid;
  insert into t_results(name, passed, detail)
  values ('an expired hold returns its stock', v_after = 0 and v_code = 'expired',
          format('reserved=%s status=%s', v_after, v_code));

  -- Promo maths.
  v_res := public.validate_promo_code(v_event, 'CAIRO20', 10000);
  insert into t_results(name, passed, detail)
  values ('percentage promo takes 20%',
          (v_res->>'valid')::boolean and (v_res->>'discount_cents')::int = 2000, v_res::text);

  v_res := public.validate_promo_code(v_event, 'OPENING', 10000);
  insert into t_results(name, passed, detail)
  values ('a promo cannot cross tenants', not (v_res->>'valid')::boolean, v_res->>'message');

  -- The whole purchase: hold -> order -> pay -> tickets.
  v_res   := public.create_reservation(v_event,
    jsonb_build_array(jsonb_build_object('ticket_type_id', v_tt, 'quantity', 3)));
  v_order := public.create_order_from_reservation((v_res->>'reservation_id')::uuid,
    'Test Buyer', 'demo@tazkarti.app', null, 'CAIRO20');
  insert into t_results(name, passed, detail)
  values ('order totals apply discount then fee',
          (v_order->>'discount_cents')::int = (v_order->>'subtotal_cents')::int / 5
      and (v_order->>'total_cents')::int =
          (v_order->>'subtotal_cents')::int - (v_order->>'discount_cents')::int
          + (v_order->>'fee_cents')::int,
          v_order::text);

  v_fin := public.finalize_order_payment((v_order->>'order_id')::uuid, 'pi_test', v_secret);
  select quantity_sold, quantity_reserved into v_after, v_n
    from public.ticket_types where id = v_tt;
  insert into t_results(name, passed, detail)
  values ('paying issues tickets and moves stock to sold',
          (v_fin->>'ticket_count')::int = 3 and v_n = 0,
          format('tickets=%s sold=%s reserved=%s', v_fin->>'ticket_count', v_after, v_n));

  -- A replayed webhook must not double-issue.
  v_fin := public.finalize_order_payment((v_order->>'order_id')::uuid, 'pi_test', v_secret);
  select count(*) into v_n from public.tickets where order_id = (v_order->>'order_id')::uuid;
  insert into t_results(name, passed, detail)
  values ('finalisation is idempotent', (v_fin->>'already_finalized')::boolean and v_n = 3,
          format('already=%s tickets=%s', v_fin->>'already_finalized', v_n));

  -- The payment RPC refuses a caller without the server secret.
  begin
    perform public.finalize_order_payment((v_order->>'order_id')::uuid, 'x', 'not-the-secret');
    insert into t_results(name, passed, detail)
    values ('finalisation rejects a bad server secret', false, 'no error');
  exception when others then
    insert into t_results(name, passed, detail)
    values ('finalisation rejects a bad server secret', sqlerrm = 'unauthorized', sqlerrm);
  end;

  -- Reserved seating: hold a seat, prove nobody else can take it, then buy it.
  select id into v_seat from public.event_seats
   where event_id = v_seated and status = 'available' order by id limit 1;
  v_res := public.create_reservation(v_seated, '[]'::jsonb, array[v_seat]);
  select status into v_code from public.event_seats where id = v_seat;
  insert into t_results(name, passed, detail)
  values ('holding a seat marks it held', v_code = 'held', format('status=%s', v_code));

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
  begin
    perform public.create_reservation(v_seated, '[]'::jsonb, array[v_seat]);
    insert into t_results(name, passed, detail)
    values ('a held seat cannot be double-booked', false, 'second hold succeeded');
  exception when others then
    insert into t_results(name, passed, detail)
    values ('a held seat cannot be double-booked', sqlerrm like '%no longer available%', sqlerrm);
  end;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_buyer, 'role', 'authenticated')::text, true);

  v_order := public.create_order_from_reservation((v_res->>'reservation_id')::uuid,
    'Test Buyer', 'demo@tazkarti.app');
  perform public.finalize_order_payment((v_order->>'order_id')::uuid, 'pi_seat', v_secret);
  select status into v_code from public.event_seats where id = v_seat;
  select seat_label into v_label from public.tickets
   where order_id = (v_order->>'order_id')::uuid limit 1;
  insert into t_results(name, passed, detail)
  values ('a paid seat becomes sold and is labelled',
          v_code = 'sold' and v_label like '%Row %', format('status=%s label=%s', v_code, v_label));
end $$;

select name, passed, left(coalesce(detail, ''), 140) as detail from t_results order by seq;

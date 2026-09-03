-- ============================================================================
-- Check-in state machine and refunds.
-- ============================================================================
create temp table t_gate(seq serial, name text, passed boolean, detail text);

do $$
declare
  v_buyer uuid := (select id from auth.users where email = 'demo@tazkarti.app');
  v_own1  uuid := (select id from auth.users where email = 'cairolive@tazkarti.app');
  v_event uuid;
  v_ticket record;
  v_order uuid;
  v_secret constant text := current_setting('tazkarti.server_secret', true);
  v_r jsonb; v_status text; v_seat_status text; v_n int; v_sold int;
begin
  select t.id, t.ticket_code, t.qr_secret, t.order_id, t.event_id into v_ticket
    from public.tickets t
    join public.events e on e.id = t.event_id
   where t.status = 'valid' and e.organizer_id = '11111111-1111-1111-1111-111111111111'
   limit 1;
  v_event := v_ticket.event_id;
  v_order := v_ticket.order_id;

  -- Someone with no role at this tenant cannot scan.
  perform set_config('request.jwt.claims', json_build_object('sub', v_buyer, 'role','authenticated')::text, true);
  begin
    perform public.scan_ticket(v_ticket.ticket_code, v_ticket.qr_secret, v_event);
    insert into t_gate(name, passed, detail) values ('a non-member cannot scan', false, 'scan succeeded');
  exception when others then
    insert into t_gate(name, passed, detail) values ('a non-member cannot scan', sqlstate = '42501', sqlerrm);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', v_own1, 'role','authenticated')::text, true);

  v_r := public.scan_ticket(v_ticket.ticket_code, v_ticket.qr_secret, v_event, 'gate-A');
  select status into v_status from public.tickets where id = v_ticket.id;
  insert into t_gate(name, passed, detail)
  values ('the first scan admits the ticket', v_r->>'result' = 'valid' and v_status = 'used',
          format('result=%s status=%s', v_r->>'result', v_status));

  v_r := public.scan_ticket(v_ticket.ticket_code, v_ticket.qr_secret, v_event);
  insert into t_gate(name, passed, detail)
  values ('a second scan is refused', v_r->>'result' = 'already_used', v_r->>'result');

  v_r := public.scan_ticket(v_ticket.ticket_code, gen_random_uuid(), v_event);
  insert into t_gate(name, passed, detail)
  values ('a forged QR secret is refused', v_r->>'result' = 'not_found', v_r->>'result');

  select count(*) into v_n from public.ticket_scans where scanned_code = v_ticket.ticket_code;
  insert into t_gate(name, passed, detail)
  values ('every scan attempt is logged', v_n >= 3, format('logged=%s', v_n));

  perform public.undo_check_in(v_ticket.id);
  select status into v_status from public.tickets where id = v_ticket.id;
  insert into t_gate(name, passed, detail)
  values ('a check-in can be undone', v_status = 'valid', v_status);

  -- A partial refund leaves the tickets usable.
  v_r := public.record_refund(v_order, 100, 'goodwill', 're_partial', v_secret);
  select status into v_status from public.orders where id = v_order;
  select count(*) into v_n from public.tickets where order_id = v_order and status = 'valid';
  insert into t_gate(name, passed, detail)
  values ('a partial refund keeps tickets valid',
          v_status = 'partially_refunded' and v_n > 0, format('order=%s valid=%s', v_status, v_n));

  -- Refunding more than the order total is refused.
  begin
    perform public.record_refund(v_order, 99999999, 'oops', 're_over', v_secret);
    insert into t_gate(name, passed, detail) values ('a refund cannot exceed the total', false, 'no error');
  exception when others then
    insert into t_gate(name, passed, detail)
    values ('a refund cannot exceed the total', sqlerrm like '%exceeds%', sqlerrm);
  end;

  -- A full refund voids the tickets and returns the stock.
  select quantity_sold into v_sold from public.ticket_types
   where id = (select ticket_type_id from public.tickets where order_id = v_order limit 1);
  v_r := public.record_refund(v_order,
    (select total_cents - refunded_cents from public.orders where id = v_order),
    'customer request', 're_full', v_secret);
  select status into v_status from public.orders where id = v_order;
  select count(*) into v_n from public.tickets where order_id = v_order and status = 'refunded';
  insert into t_gate(name, passed, detail)
  values ('a full refund voids the tickets',
          v_status = 'refunded' and v_n > 0 and (v_r->>'full_refund')::boolean,
          format('order=%s refunded=%s', v_status, v_n));

  select quantity_sold into v_n from public.ticket_types
   where id = (select ticket_type_id from public.tickets where order_id = v_order limit 1);
  insert into t_gate(name, passed, detail)
  values ('a refund returns stock to the pool', v_n < v_sold,
          format('sold_before=%s sold_after=%s', v_sold, v_n));

  -- A refunded ticket is refused at the gate.
  v_r := public.scan_ticket(v_ticket.ticket_code, v_ticket.qr_secret, v_event);
  insert into t_gate(name, passed, detail)
  values ('a refunded ticket is refused at the gate', v_r->>'result' = 'void', v_r->>'result');
end $$;

select name, passed, left(coalesce(detail, ''), 140) as detail from t_gate order by seq;

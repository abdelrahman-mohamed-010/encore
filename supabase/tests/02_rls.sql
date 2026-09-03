-- ============================================================================
-- Row-level security and tenant isolation.
-- Each check switches to the `authenticated` (or `anon`) Postgres role so RLS
-- is actually enforced — as superuser it would be bypassed and prove nothing.
-- ============================================================================
create temp table t_rls(seq serial, name text, passed boolean, detail text);

do $$
declare
  v_buyer uuid := (select id from auth.users where email = 'demo@tazkarti.app');
  v_own1  uuid := (select id from auth.users where email = 'cairolive@tazkarti.app');
  v_own2  uuid := (select id from auth.users where email = 'nilearts@tazkarti.app');
  v_staff uuid := (select id from auth.users where email = 'staff@tazkarti.app');
  v_admin uuid := (select id from auth.users where email = 'admin@tazkarti.app');
  v_org1  uuid := '11111111-1111-1111-1111-111111111111';
  v_n int; v_m int;
begin
  -- A buyer sees only their own orders.
  perform set_config('request.jwt.claims', json_build_object('sub', v_buyer, 'role','authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into v_n from public.orders;
  select count(*) into v_m from public.orders where user_id = v_buyer;
  perform set_config('role', 'postgres', true);
  insert into t_rls(name, passed, detail)
  values ('a buyer sees only their own orders', v_n = v_m, format('visible=%s own=%s', v_n, v_m));

  -- One tenant cannot read another tenant's orders.
  perform set_config('request.jwt.claims', json_build_object('sub', v_own2, 'role','authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into v_n from public.orders where organizer_id = v_org1;
  perform set_config('role', 'postgres', true);
  insert into t_rls(name, passed, detail)
  values ('tenant isolation: orders', v_n = 0, format('leaked=%s', v_n));

  -- ...nor their promo codes.
  perform set_config('role', 'authenticated', true);
  select count(*) into v_n from public.promo_codes where organizer_id = v_org1;
  perform set_config('role', 'postgres', true);
  insert into t_rls(name, passed, detail)
  values ('tenant isolation: promo codes', v_n = 0, format('leaked=%s', v_n));

  -- ...nor their connected payment account.
  perform set_config('role', 'authenticated', true);
  select count(*) into v_n from public.payment_accounts;
  perform set_config('role', 'postgres', true);
  insert into t_rls(name, passed, detail)
  values ('tenant isolation: payment accounts', v_n = 0, format('visible=%s', v_n));

  -- The tenant's own team can read its orders.
  perform set_config('request.jwt.claims', json_build_object('sub', v_own1, 'role','authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into v_n from public.orders where organizer_id = v_org1;
  perform set_config('role', 'postgres', true);
  insert into t_rls(name, passed, detail)
  values ('a tenant owner sees their own orders', v_n > 0, format('rows=%s', v_n));

  perform set_config('request.jwt.claims', json_build_object('sub', v_staff, 'role','authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into v_n from public.orders where organizer_id = v_org1;
  perform set_config('role', 'postgres', true);
  insert into t_rls(name, passed, detail)
  values ('a staff member sees their tenant orders', v_n > 0, format('rows=%s', v_n));

  -- Anonymous visitors see published events only, and no commerce data at all.
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);
  select count(*) into v_n from public.events where status <> 'published';
  select (select count(*) from public.orders) + (select count(*) from public.tickets) into v_m;
  perform set_config('role', 'postgres', true);
  insert into t_rls(name, passed, detail)
  values ('anon sees published events only', v_n = 0, format('non_published_visible=%s', v_n));
  insert into t_rls(name, passed, detail)
  values ('anon cannot read orders or tickets', v_m = 0, format('rows=%s', v_m));

  -- A user cannot promote themselves; an admin can.
  perform set_config('request.jwt.claims', json_build_object('sub', v_buyer, 'role','authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    update public.profiles set role = 'admin' where id = v_buyer;
    perform set_config('role', 'postgres', true);
    insert into t_rls(name, passed, detail) values ('self role-escalation blocked', false, 'update succeeded');
  exception when others then
    perform set_config('role', 'postgres', true);
    insert into t_rls(name, passed, detail) values ('self role-escalation blocked', sqlstate = '42501', sqlerrm);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role','authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    update public.profiles set role = 'attendee' where id = v_buyer;
    perform set_config('role', 'postgres', true);
    insert into t_rls(name, passed, detail) values ('an admin can change roles', true, 'ok');
  exception when others then
    perform set_config('role', 'postgres', true);
    insert into t_rls(name, passed, detail) values ('an admin can change roles', false, sqlerrm);
  end;
end $$;

select name, passed, left(coalesce(detail, ''), 140) as detail from t_rls order by seq;

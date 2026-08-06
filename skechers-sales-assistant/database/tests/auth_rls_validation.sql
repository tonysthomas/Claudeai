-- =============================================================================
-- Authentication / RLS validation (Phase 6)
-- Run after migrations + seed:
--   psql -v ON_ERROR_STOP=1 -f database/tests/auth_rls_validation.sql
--
-- Exercises recommendation_events + catalogue RLS as a NON-superuser role with a
-- simulated JWT (request.jwt.claims) and demo-mode GUC (app.demo_mode), proving:
--  * anonymous event inserts only in demo mode (blocked in production);
--  * authenticated inserts only for the caller's own id + assigned store;
--  * arbitrary associate_id / store_id rejected;
--  * associates cannot update/delete events;
--  * associates cannot write products / relationships / catalogue tables;
--  * associates can read their own profile.
-- =============================================================================
\set ON_ERROR_STOP on

-- Setup (as owner/superuser) -------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'rls_tester') then
    create role rls_tester login password 'x' nosuperuser;
  end if;
end $$;

grant usage on schema public to rls_tester;
grant select, insert, update, delete on public.recommendation_events to rls_tester;
grant select on public.associate_profiles, public.stores, public.products, public.customer_needs, public.product_relationships to rls_tester;
grant insert, update on public.products, public.product_relationships, public.recommendation_approvals, public.catalogue_imports to rls_tester;

drop table if exists t_ctx;
create temp table t_ctx as
  select (select id from public.products where sku = 'SHOE-WALK-001') as pid1,
         (select id from public.products where sku = 'SHOE-WALK-002') as pid2,
         (select id from public.stores where name = 'Demo Store 1')  as store_id,
         '00000000-0000-0000-0000-000000000001'::uuid                as uid,
         '11111111-1111-1111-1111-111111111111'::uuid                as other_uid,
         '22222222-2222-2222-2222-222222222222'::uuid                as other_store;
grant select on t_ctx to rls_tester;

begin;
set local role rls_tester;

-- A. Demo anonymous insert allowed when demo mode is ON -----------------------
do $$
declare c t_ctx; begin
  select * into c from t_ctx;
  perform set_config('app.demo_mode', 'true', true);
  perform set_config('request.jwt.claims', '', true);
  insert into public.recommendation_events (selected_product_id, recommended_product_id, action, associate_id, store_id)
    values (c.pid1, c.pid2, 'displayed', null, null);
  raise notice 'PASS A: anonymous insert allowed in demo mode';
end $$;

-- B. Demo anonymous insert BLOCKED when demo mode is OFF (production) ---------
do $$
declare c t_ctx; begin
  select * into c from t_ctx;
  perform set_config('app.demo_mode', 'false', true);
  perform set_config('request.jwt.claims', '', true);
  begin
    insert into public.recommendation_events (selected_product_id, recommended_product_id, action, associate_id, store_id)
      values (c.pid1, c.pid2, 'displayed', null, null);
    raise exception 'FAIL B: anonymous insert allowed in production';
  exception when insufficient_privilege then
    raise notice 'PASS B: anonymous insert blocked in production';
  end;
end $$;

-- C. Authenticated insert with own id + assigned store allowed ---------------
do $$
declare c t_ctx; begin
  select * into c from t_ctx;
  perform set_config('app.demo_mode', 'false', true);
  perform set_config('request.jwt.claims', json_build_object('sub', c.uid)::text, true);
  insert into public.recommendation_events (selected_product_id, recommended_product_id, action, associate_id, store_id)
    values (c.pid1, c.pid2, 'displayed', c.uid, c.store_id);
  raise notice 'PASS C: authenticated insert with own id + store allowed';
end $$;

-- D. Arbitrary associate_id rejected -----------------------------------------
do $$
declare c t_ctx; begin
  select * into c from t_ctx;
  perform set_config('request.jwt.claims', json_build_object('sub', c.uid)::text, true);
  begin
    insert into public.recommendation_events (selected_product_id, recommended_product_id, action, associate_id, store_id)
      values (c.pid1, c.pid2, 'displayed', c.other_uid, c.store_id);
    raise exception 'FAIL D: arbitrary associate_id allowed';
  exception when insufficient_privilege then
    raise notice 'PASS D: arbitrary associate_id rejected';
  end;
end $$;

-- E. Arbitrary store_id rejected ---------------------------------------------
do $$
declare c t_ctx; begin
  select * into c from t_ctx;
  perform set_config('request.jwt.claims', json_build_object('sub', c.uid)::text, true);
  begin
    insert into public.recommendation_events (selected_product_id, recommended_product_id, action, associate_id, store_id)
      values (c.pid1, c.pid2, 'displayed', c.uid, c.other_store);
    raise exception 'FAIL E: arbitrary store_id allowed';
  exception when insufficient_privilege then
    raise notice 'PASS E: arbitrary store_id rejected';
  end;
end $$;

-- F. Associates cannot update or delete events -------------------------------
do $$
declare n int; begin
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from t_ctx))::text, true);
  with u as (update public.recommendation_events set action = 'opened' returning 1) select count(*) into n from u;
  if n <> 0 then raise exception 'FAIL F: associate updated % event rows', n; end if;
  with d as (delete from public.recommendation_events returning 1) select count(*) into n from d;
  if n <> 0 then raise exception 'FAIL F: associate deleted % event rows', n; end if;
  raise notice 'PASS F: associates cannot update/delete events';
end $$;

-- G. Associates cannot write products / relationships / catalogue ------------
do $$
declare c t_ctx; begin
  select * into c from t_ctx;
  begin
    insert into public.products (sku, name, category) values ('HACK-1', 'x', 'shoes');
    raise exception 'FAIL G: associate inserted a product';
  exception when insufficient_privilege then raise notice 'PASS G1: cannot insert products'; end;
  begin
    insert into public.product_relationships (source_product_id, target_product_id, relationship_type, reason, customer_benefit)
      values (c.pid1, c.pid2, 'pairs_with', 'x', 'y');
    raise exception 'FAIL G: associate inserted a relationship';
  exception when insufficient_privilege then raise notice 'PASS G2: cannot insert relationships'; end;
  begin
    insert into public.recommendation_approvals (product_id, approval_status) values (c.pid1, 'approved');
    raise exception 'FAIL G: associate inserted an approval';
  exception when insufficient_privilege then raise notice 'PASS G3: cannot approve records'; end;
  begin
    insert into public.catalogue_imports (file_format, source_type) values ('csv', 'catalogue');
    raise exception 'FAIL G: associate inserted a catalogue import';
  exception when insufficient_privilege then raise notice 'PASS G4: cannot write catalogue-import tables'; end;
end $$;

-- H. Associates can read their own profile -----------------------------------
do $$
declare n int; begin
  perform set_config('app.demo_mode', 'false', true);
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from t_ctx))::text, true);
  select count(*) into n from public.associate_profiles where auth_user_id = (select uid from t_ctx);
  if n <> 1 then raise exception 'FAIL H: associate cannot read own profile (got %)', n; end if;
  raise notice 'PASS H: associate can read own profile';
end $$;

rollback;
reset role;

do $$ begin raise notice '========= ALL AUTH/RLS VALIDATIONS PASSED ========='; end $$;

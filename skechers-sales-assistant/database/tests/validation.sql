-- =============================================================================
-- Skechers Sales Assistant — Database validation tests (Phase 2)
--
-- Run against a database that has the migration + seed applied. Use with:
--   psql -v ON_ERROR_STOP=1 -f database/tests/validation.sql
-- Any failed assertion RAISEs an exception and aborts with a non-zero exit.
-- Negative tests run inside plpgsql sub-transactions, so a correctly rejected
-- insert is caught and reported as PASS without leaving data behind.
-- =============================================================================
\set ON_ERROR_STOP on

-- 1. All 8 tables exist -------------------------------------------------------
do $$
declare
  expected text[] := array[
    'products','product_sources','product_relationships','recommendation_approvals',
    'customer_needs','stores','inventory','recommendation_events'];
  t text;
  n int;
begin
  foreach t in array expected loop
    select count(*) into n
      from information_schema.tables
     where table_schema = 'public' and table_name = t;
    if n <> 1 then raise exception 'FAIL: table % is missing', t; end if;
  end loop;
  raise notice 'PASS 1: all 8 core tables exist';
end $$;

-- 2. Seed data loaded with expected counts ------------------------------------
do $$
declare c int;
begin
  select count(*) into c from public.products;               if c <> 21 then raise exception 'FAIL: products=% (want 21)', c; end if;
  select count(*) into c from public.products where category='shoes';     if c <> 13 then raise exception 'FAIL: shoes=% (want 13)', c; end if;
  select count(*) into c from public.products where category='socks';     if c <> 5  then raise exception 'FAIL: socks=% (want 5)', c;  end if;
  select count(*) into c from public.products where category='shoe_care'; if c <> 3  then raise exception 'FAIL: shoe_care=% (want 3)', c; end if;
  select count(*) into c from public.product_sources;        if c <> 21 then raise exception 'FAIL: product_sources=% (want 21)', c; end if;
  select count(*) into c from public.product_relationships;  if c <> 48 then raise exception 'FAIL: relationships=% (want 48)', c; end if;
  select count(*) into c from public.customer_needs;         if c <> 9  then raise exception 'FAIL: customer_needs=% (want 9)', c; end if;
  select count(*) into c from public.stores;                 if c <> 1  then raise exception 'FAIL: stores=% (want 1)', c; end if;
  select count(*) into c from public.inventory;              if c < 1   then raise exception 'FAIL: inventory empty'; end if;
  select count(*) into c from public.recommendation_events;  if c <> 5  then raise exception 'FAIL: events=% (want 5)', c; end if;
  select count(*) into c from public.recommendation_approvals; if c <> 6 then raise exception 'FAIL: approvals=% (want 6)', c; end if;
  raise notice 'PASS 2: seed counts correct (21 products, 48 relationships, ...)';
end $$;

-- 3. Products can be queried ---------------------------------------------------
do $$
declare c int;
begin
  select count(*) into c from public.products where sku = 'SHOE-WALK-001';
  if c <> 1 then raise exception 'FAIL: could not query product by SKU'; end if;
  raise notice 'PASS 3: products queryable by SKU';
end $$;

-- 4. Recommendations queryable by source product ------------------------------
do $$
declare c int;
begin
  select count(*) into c
    from public.product_relationships r
    join public.products p on p.id = r.source_product_id
   where p.sku = 'SHOE-WALK-001' and r.active;
  if c < 1 then raise exception 'FAIL: no recommendations for SHOE-WALK-001'; end if;
  raise notice 'PASS 4: % recommendations queryable for SHOE-WALK-001', c;
end $$;

-- 5. Duplicate SKU rejected ---------------------------------------------------
do $$
begin
  begin
    insert into public.products (sku, name, category) values ('SHOE-WALK-001', 'dup', 'shoes');
    raise exception 'FAIL: duplicate SKU was allowed';
  exception when unique_violation then
    raise notice 'PASS 5: duplicate SKU rejected';
  end;
end $$;

-- 6. Self-referencing relationship rejected -----------------------------------
do $$
declare pid uuid;
begin
  select id into pid from public.products where sku = 'SHOE-WALK-001';
  begin
    insert into public.product_relationships
      (source_product_id, target_product_id, relationship_type, reason, customer_benefit)
      values (pid, pid, 'pairs_with', 'r', 'b');
    raise exception 'FAIL: self-referencing relationship was allowed';
  exception when check_violation then
    raise notice 'PASS 6: self-referencing relationship rejected';
  end;
end $$;

-- 7. Invalid relationship type rejected ---------------------------------------
do $$
declare a uuid; b uuid;
begin
  select id into a from public.products where sku = 'SHOE-WALK-001';
  select id into b from public.products where sku = 'SHOE-WALK-002';
  begin
    insert into public.product_relationships
      (source_product_id, target_product_id, relationship_type, reason, customer_benefit)
      values (a, b, 'not_a_real_type', 'r', 'b');
    raise exception 'FAIL: invalid relationship_type was allowed';
  exception when check_violation then
    raise notice 'PASS 7: invalid relationship_type rejected';
  end;
end $$;

-- 8. Invalid status value rejected --------------------------------------------
do $$
begin
  begin
    insert into public.products (sku, name, category, approval_status)
      values ('SHOE-BADSTATUS-001', 'bad', 'shoes', 'totally_invalid');
    raise exception 'FAIL: invalid approval_status was allowed';
  exception when check_violation then
    raise notice 'PASS 8: invalid approval_status rejected';
  end;
end $$;

-- 9. Foreign keys enforced ----------------------------------------------------
do $$
begin
  begin
    insert into public.product_relationships
      (source_product_id, target_product_id, relationship_type, reason, customer_benefit)
      values (gen_random_uuid(), gen_random_uuid(), 'pairs_with', 'r', 'b');
    raise exception 'FAIL: relationship to non-existent products was allowed';
  exception when foreign_key_violation then
    raise notice 'PASS 9: foreign keys enforced (non-existent products rejected)';
  end;
end $$;

-- 10. Duplicate inventory (product, store, size) rejected ---------------------
do $$
declare pid uuid; sid uuid;
begin
  select id into pid from public.products where sku = 'SHOE-WALK-001';
  select id into sid from public.stores where name = 'Demo Store 1';
  begin
    -- size '8' already exists for this product/store from the seed
    insert into public.inventory (product_id, store_id, size, quantity)
      values (pid, sid, '8', 1);
    raise exception 'FAIL: duplicate inventory row was allowed';
  exception when unique_violation then
    raise notice 'PASS 10: duplicate inventory (product/store/size) rejected';
  end;
end $$;

-- 11. Inventory queryable by store and product --------------------------------
do $$
declare c int;
begin
  select count(*) into c
    from public.inventory i
    join public.products p on p.id = i.product_id
    join public.stores   s on s.id = i.store_id
   where p.sku = 'SHOE-WALK-001' and s.name = 'Demo Store 1';
  if c < 1 then raise exception 'FAIL: inventory not queryable by store/product'; end if;
  raise notice 'PASS 11: inventory queryable by store & product (% rows)', c;
end $$;

-- 12. Official data-source fields exist for future synchronization ------------
do $$
declare
  prod_cols text[] := array[
    'source_type','source_url','source_identifier','source_version','product_url',
    'data_status','approval_status','approved_by','approved_at','last_synced_at','imported_at'];
  src_cols text[] := array[
    'source_type','source_url','source_region','source_version','permission_status',
    'captured_at','synced_at','approval_status'];
  col text; n int;
begin
  foreach col in array prod_cols loop
    select count(*) into n from information_schema.columns
     where table_schema='public' and table_name='products' and column_name=col;
    if n <> 1 then raise exception 'FAIL: products.% missing', col; end if;
  end loop;
  foreach col in array src_cols loop
    select count(*) into n from information_schema.columns
     where table_schema='public' and table_name='product_sources' and column_name=col;
    if n <> 1 then raise exception 'FAIL: product_sources.% missing', col; end if;
  end loop;
  raise notice 'PASS 12: official data-source fields present on products & product_sources';
end $$;

-- 13. Priority must be greater than zero --------------------------------------
do $$
declare a uuid; b uuid;
begin
  select id into a from public.products where sku = 'SHOE-WALK-001';
  select id into b from public.products where sku = 'SHOE-WALK-002';
  begin
    insert into public.product_relationships
      (source_product_id, target_product_id, relationship_type, priority, reason, customer_benefit)
      values (a, b, 'pairs_with', 0, 'r', 'b');
    raise exception 'FAIL: priority = 0 was allowed';
  exception when check_violation then
    raise notice 'PASS 13: priority must be > 0 (zero rejected)';
  end;
end $$;

-- 14. Barcode unique when present ---------------------------------------------
do $$
begin
  begin
    insert into public.products (sku, name, category, barcode) values ('BC-1', 'bc one', 'shoes', 'DUP-BARCODE');
    insert into public.products (sku, name, category, barcode) values ('BC-2', 'bc two', 'shoes', 'DUP-BARCODE');
    raise exception 'FAIL: duplicate barcode was allowed';
  exception when unique_violation then
    raise notice 'PASS 14: duplicate barcode rejected (unique when present)';
  end;
end $$;

do $$ begin raise notice '================= ALL VALIDATIONS PASSED ================='; end $$;

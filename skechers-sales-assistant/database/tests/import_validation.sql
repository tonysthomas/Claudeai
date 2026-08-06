-- =============================================================================
-- Catalogue-import schema validation (Phase 3)
-- Run after BOTH migrations + seed are applied:
--   psql -v ON_ERROR_STOP=1 -f database/tests/import_validation.sql
-- Wrapped in a transaction that rolls back, so it leaves no data behind.
-- =============================================================================
\set ON_ERROR_STOP on
begin;

-- I1. The 3 import tables exist -----------------------------------------------
do $$
declare t text; n int;
begin
  foreach t in array array['catalogue_imports','catalogue_import_rows','catalogue_versions'] loop
    select count(*) into n from information_schema.tables where table_schema='public' and table_name=t;
    if n <> 1 then raise exception 'FAIL: table % missing', t; end if;
  end loop;
  raise notice 'PASS I1: catalogue import tables exist';
end $$;

-- Seed a demo import + product ref for reuse ----------------------------------
create temp table t_ids(imp uuid, prod uuid) on commit drop;
do $$
declare imp uuid; prod uuid;
begin
  insert into public.catalogue_imports (file_name, file_format, source_type, region, currency, imported_by, total_rows, valid_rows, invalid_rows)
    values ('demo.csv','csv','catalogue','DEMO','DEMO','tester',2,1,1) returning id into imp;
  insert into public.catalogue_import_rows (import_id, row_number, raw_data, validation_status, action)
    values (imp, 1, '{"sku":"DEMO-IMP-001"}'::jsonb, 'valid', 'insert');
  select id into prod from public.products where sku='SHOE-WALK-001';
  insert into public.catalogue_versions (product_id, import_id, version_number, snapshot, approval_status, changed_by)
    values (prod, imp, 1, '{"sku":"SHOE-WALK-001"}'::jsonb, 'pending_review', 'tester');
  insert into t_ids values (imp, prod);
  raise notice 'PASS I2: import batch + row + version insert OK (traceable to source/importer)';
end $$;

-- I3. Foreign key on import rows enforced -------------------------------------
do $$
begin
  begin
    insert into public.catalogue_import_rows (import_id, row_number, raw_data)
      values (gen_random_uuid(), 99, '{}'::jsonb);
    raise exception 'FAIL: import row with non-existent import_id allowed';
  exception when foreign_key_violation then raise notice 'PASS I3: import_rows FK enforced';
  end;
end $$;

-- I4. Duplicate (import_id, row_number) rejected ------------------------------
do $$
declare imp uuid := (select imp from t_ids limit 1);
begin
  insert into public.catalogue_import_rows (import_id, row_number, raw_data) values (imp, 10, '{}'::jsonb);
  begin
    insert into public.catalogue_import_rows (import_id, row_number, raw_data) values (imp, 10, '{}'::jsonb);
    raise exception 'FAIL: duplicate (import_id,row_number) allowed';
  exception when unique_violation then raise notice 'PASS I4: duplicate import row_number rejected';
  end;
end $$;

-- I5. Invalid file_format rejected --------------------------------------------
do $$
begin
  begin
    insert into public.catalogue_imports (file_format, source_type) values ('pdf', 'catalogue');
    raise exception 'FAIL: invalid file_format allowed';
  exception when check_violation then raise notice 'PASS I5: invalid file_format rejected';
  end;
end $$;

-- I6. Invalid import status rejected ------------------------------------------
do $$
begin
  begin
    insert into public.catalogue_imports (file_format, source_type, status) values ('csv', 'catalogue', 'bogus');
    raise exception 'FAIL: invalid status allowed';
  exception when check_violation then raise notice 'PASS I6: invalid import status rejected';
  end;
end $$;

-- I7. Invalid validation_status on a row rejected -----------------------------
do $$
declare imp uuid := (select imp from t_ids limit 1);
begin
  begin
    insert into public.catalogue_import_rows (import_id, row_number, raw_data, validation_status)
      values (imp, 20, '{}'::jsonb, 'not_a_status');
    raise exception 'FAIL: invalid validation_status allowed';
  exception when check_violation then raise notice 'PASS I7: invalid validation_status rejected';
  end;
end $$;

-- I8. Duplicate product version rejected --------------------------------------
do $$
declare prod uuid := (select prod from t_ids limit 1); imp uuid := (select imp from t_ids limit 1);
begin
  insert into public.catalogue_versions (product_id, import_id, version_number, snapshot, approval_status)
    values (prod, imp, 5, '{}'::jsonb, 'pending_review');
  begin
    insert into public.catalogue_versions (product_id, import_id, version_number, snapshot, approval_status)
      values (prod, imp, 5, '{}'::jsonb, 'pending_review');
    raise exception 'FAIL: duplicate product version allowed';
  exception when unique_violation then raise notice 'PASS I8: duplicate product version rejected';
  end;
end $$;

do $$ begin raise notice '============= ALL IMPORT VALIDATIONS PASSED ============='; end $$;

rollback;

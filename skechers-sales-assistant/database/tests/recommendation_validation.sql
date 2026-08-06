-- =============================================================================
-- Recommendation coverage validation (Phase 5 seed expansion)
-- Run after migrations + seed:
--   psql -v ON_ERROR_STOP=1 -f database/tests/recommendation_validation.sql
-- Verifies the seed gives the engine enough approved, non-duplicate,
-- non-self-referencing coverage to return recommendations for several products.
-- =============================================================================
\set ON_ERROR_STOP on

-- R1. No self-referencing relationships ---------------------------------------
do $$
declare c int;
begin
  select count(*) into c from public.product_relationships where source_product_id = target_product_id;
  if c <> 0 then raise exception 'FAIL R1: % self-referencing relationships', c; end if;
  raise notice 'PASS R1: no self-referencing relationships';
end $$;

-- R2. No duplicate (source, target, type, region) edges -----------------------
do $$
declare total int; distinct_edges int;
begin
  select count(*), count(distinct (source_product_id, target_product_id, relationship_type, region))
    into total, distinct_edges from public.product_relationships;
  if total <> distinct_edges then raise exception 'FAIL R2: duplicate relationships (% total vs % distinct)', total, distinct_edges; end if;
  raise notice 'PASS R2: no duplicate relationships (% edges)', total;
end $$;

-- R3. At least five shoe products have >= 1 slottable relationship ------------
do $$
declare c int;
begin
  select count(*) into c from (
    select p.id
    from public.products p
    join public.product_relationships r
      on r.source_product_id = p.id and r.active and r.approval_status in ('approved','demo') and r.region = p.region
    join public.products t on t.id = r.target_product_id
    where p.category = 'shoes'
      and (r.relationship_type in ('upgrade_to','alternative_to')
           or (r.relationship_type in ('pairs_with','recommended_add_on') and t.category in ('socks','shoe_care')))
    group by p.id
  ) x;
  if c < 5 then raise exception 'FAIL R3: only % shoes have a slottable relationship (want >= 5)', c; end if;
  raise notice 'PASS R3: % shoe products have >= 1 slottable relationship', c;
end $$;

-- R4. The five named products have all six types + distinct slot targets ------
do $$
declare
  skus text[] := array['SHOE-WALK-001','SHOE-WORK-001','SHOE-FIT-001','SHOE-EVERYDAY-002','SHOE-TRAIL-001'];
  req  text[] := array['upgrade_to','alternative_to','pairs_with','recommended_add_on','best_for_activity','recommended_for_customer_need'];
  sk text; tp text; n int; up uuid; al uuid; ad uuid;
begin
  foreach sk in array skus loop
    foreach tp in array req loop
      select count(*) into n from public.product_relationships r join public.products p on p.id = r.source_product_id
        where p.sku = sk and r.relationship_type = tp;
      if n < 1 then raise exception 'FAIL R4: % is missing relationship_type %', sk, tp; end if;
    end loop;
    select r.target_product_id into up from public.product_relationships r join public.products p on p.id = r.source_product_id
      where p.sku = sk and r.relationship_type = 'upgrade_to' limit 1;
    select r.target_product_id into al from public.product_relationships r join public.products p on p.id = r.source_product_id
      where p.sku = sk and r.relationship_type = 'alternative_to' limit 1;
    select r.target_product_id into ad from public.product_relationships r join public.products p on p.id = r.source_product_id
      join public.products t on t.id = r.target_product_id
      where p.sku = sk and r.relationship_type in ('pairs_with','recommended_add_on') and t.category in ('socks','shoe_care') limit 1;
    if up is null or al is null or ad is null then raise exception 'FAIL R4: % missing a slot', sk; end if;
    if up = al or up = ad or al = ad then raise exception 'FAIL R4: % slot targets are not distinct', sk; end if;
  end loop;
  raise notice 'PASS R4: five named products have full type coverage + distinct upgrade/alternative/add-on targets';
end $$;

-- R5. All relationships are demo-region and approved/demo ---------------------
do $$
declare c int;
begin
  select count(*) into c from public.product_relationships
    where region <> 'DEMO' or approval_status not in ('approved','demo');
  if c <> 0 then raise exception 'FAIL R5: % relationships outside demo region/approval', c; end if;
  raise notice 'PASS R5: all relationships are demo-region and approved/demo';
end $$;

do $$ begin raise notice '========= ALL RECOMMENDATION VALIDATIONS PASSED ========='; end $$;

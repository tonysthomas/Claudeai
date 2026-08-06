-- =============================================================================
-- Skechers Sales Assistant — Synthetic seed data (Phase 2)
--
-- SYNTHETIC DEMO DATA ONLY. Names, prices, descriptions, and images are
-- invented for prototyping and do NOT represent real Skechers products.
-- currency/region='DEMO', source_type='synthetic_demo', data_status='demo',
-- approval_status='demo'.
--
-- Idempotent: clears demo rows first so `psql -f seed.sql` / `supabase db
-- reset` can be re-run. customer_needs are reference data seeded by the
-- migration and are left intact.
-- =============================================================================

truncate table
  public.recommendation_events,
  public.recommendation_approvals,
  public.inventory,
  public.product_relationships,
  public.product_sources,
  public.products,
  public.stores
restart identity cascade;

-- -----------------------------------------------------------------------------
-- Products: 10 shoes, 5 socks, 3 shoe-care  (source/status use demo defaults)
-- -----------------------------------------------------------------------------
insert into public.products
  (sku, name, category, subcategory, gender, color, size_range, price, image_url, description, key_features, technology, activity_type)
values
  -- shoes (10)
  ('SHOE-WALK-001',    'Demo Walk Comfort 1',      'shoes', 'walking',            'unisex', 'Grey',     'US 7-12', 59.99, '/images/products/placeholder-shoe.svg', 'Synthetic demo walking shoe for everyday comfort.',          '["Cushioned midsole","Breathable upper"]'::jsonb, 'Demo Air Cushion',     'walking'),
  ('SHOE-WALK-002',    'Demo Walk Comfort 2',      'shoes', 'walking',            'unisex', 'Black',    'US 7-12', 89.99, '/images/products/placeholder-shoe.svg', 'Synthetic demo premium walking shoe with extra cushioning.', '["Max cushioning","Arch support"]'::jsonb,        'Demo Air Cushion Max', 'walking'),
  ('SHOE-WORK-001',    'Demo Work Cushion 1',      'shoes', 'work',               'unisex', 'Black',    'US 7-12', 69.99, '/images/products/placeholder-shoe.svg', 'Synthetic demo work shoe for long hours on your feet.',      '["Slip resistant","All-day cushioning"]'::jsonb,  'Demo Slip Resist',     'work'),
  ('SHOE-WORK-002',    'Demo Work Cushion 2',      'shoes', 'work',               'unisex', 'Brown',    'US 7-12', 99.99, '/images/products/placeholder-shoe.svg', 'Synthetic demo premium work shoe with enhanced support.',    '["Pro slip resistance","Memory foam"]'::jsonb,    'Demo Slip Resist Pro', 'work'),
  ('SHOE-FIT-001',     'Demo Sport Fit Runner 1',  'shoes', 'fitness',            'unisex', 'Blue',     'US 7-12', 74.99, '/images/products/placeholder-shoe.svg', 'Synthetic demo training shoe for the gym and running.',       '["Responsive foam","Lightweight"]'::jsonb,        'Demo Rebound Foam',    'fitness'),
  ('SHOE-TRAVEL-001',  'Demo Travel Light 1',      'shoes', 'travel',             'unisex', 'Navy',     'US 7-12', 64.99, '/images/products/placeholder-shoe.svg', 'Synthetic demo lightweight travel shoe, easy on and off.',    '["Featherweight","Packable"]'::jsonb,             'Demo Lightweight Knit','travel'),
  ('SHOE-STYLE-001',   'Demo Street Style 1',      'shoes', 'style',              'unisex', 'White',    'US 7-12', 79.99, '/images/products/placeholder-shoe.svg', 'Synthetic demo fashion sneaker for everyday style.',          '["Clean look","Comfort insole"]'::jsonb,          'Demo Comfort Insole',  'casual'),
  ('SHOE-BUDGET-001',  'Demo Budget Step 1',       'shoes', 'budget',             'unisex', 'Grey',     'US 7-12', 39.99, '/images/products/placeholder-shoe.svg', 'Synthetic demo value shoe at a friendly price.',              '["Everyday value","Cushioned"]'::jsonb,           'Demo Basic Cushion',   'walking'),
  ('SHOE-MAXC-001',    'Demo Max Cushion Cloud 1', 'shoes', 'maximum_cushioning', 'unisex', 'Teal',     'US 7-12', 94.99, '/images/products/placeholder-shoe.svg', 'Synthetic demo max-cushioning shoe for a plush ride.',        '["Cloud foam","Ultra soft"]'::jsonb,              'Demo Cloud Foam',      'walking'),
  ('SHOE-EVERYDAY-001','Demo Everyday Slip-On 1',  'shoes', 'everyday',           'unisex', 'Charcoal', 'US 7-12', 54.99, '/images/products/placeholder-shoe.svg', 'Synthetic demo slip-on for easy all-day comfort.',            '["Slip-on","Stretch fit"]'::jsonb,                'Demo Stretch Fit',     'everyday'),
  -- shoes added for Phase 5 recommendation coverage (synthetic demo)
  ('SHOE-FIT-002',     'Demo Sport Fit Runner 2',  'shoes', 'fitness',            'unisex', 'Red',      'US 7-12', 109.99,'/images/products/placeholder-shoe.svg', 'Synthetic demo premium training shoe.',                       '["Pro rebound foam","Stability heel"]'::jsonb,    'Demo Rebound Foam Pro','fitness'),
  ('SHOE-EVERYDAY-002','Demo Everyday Comfort 1',  'shoes', 'everyday',           'unisex', 'Stone',    'US 7-12', 49.99, '/images/products/placeholder-shoe.svg', 'Synthetic demo everyday comfort shoe.',                       '["Everyday comfort","Soft collar"]'::jsonb,       'Demo Comfort Foam',    'everyday'),
  ('SHOE-TRAIL-001',   'Demo Trail Active 1',      'shoes', 'trail',              'unisex', 'Olive',    'US 7-12', 84.99, '/images/products/placeholder-shoe.svg', 'Synthetic demo trail shoe for active outdoor use.',           '["Rugged outsole","Water resistant"]'::jsonb,     'Demo Trail Grip',      'trail'),
  -- socks (5)
  ('SOCK-PERF-001',    'Demo Performance Sock 1',  'socks', 'performance',        'unisex', 'White',    'M/L',     12.99, '/images/products/placeholder-sock.svg', 'Synthetic demo moisture-wicking performance socks.',          '["Moisture wicking","Arch band"]'::jsonb,         null,                   'fitness'),
  ('SOCK-PERF-002',    'Demo Performance Sock 2',  'socks', 'performance',        'unisex', 'Black',    'M/L',     14.99, '/images/products/placeholder-sock.svg', 'Synthetic demo cushioned performance socks.',                 '["Cushioned sole","Blister guard"]'::jsonb,       null,                   'fitness'),
  ('SOCK-CREW-001',    'Demo Everyday Crew Sock 1','socks', 'crew',               'unisex', 'Grey',     'M/L',      9.99, '/images/products/placeholder-sock.svg', 'Synthetic demo everyday crew socks.',                         '["Soft cotton blend","Everyday"]'::jsonb,         null,                   'everyday'),
  ('SOCK-NOSHOW-001',  'Demo No-Show Sock 1',      'socks', 'no_show',            'unisex', 'White',    'M/L',      8.99, '/images/products/placeholder-sock.svg', 'Synthetic demo no-show socks for a clean look.',              '["Stays hidden","Heel grip"]'::jsonb,             null,                   'style'),
  ('SOCK-ANKLE-001',   'Demo Cushion Ankle Sock 1','socks', 'ankle',              'unisex', 'Navy',     'M/L',     10.99, '/images/products/placeholder-sock.svg', 'Synthetic demo cushioned ankle socks.',                       '["Ankle cushion","Breathable"]'::jsonb,           null,                   'everyday'),
  -- shoe care (3)
  ('CARE-KIT-001',     'Demo Shoe Care Kit 1',     'shoe_care', 'kit',            'unisex', null,       null,      19.99, '/images/products/placeholder-care.svg', 'Synthetic demo shoe-care cleaning kit.',                      '["Cleaner","Brush","Cloth"]'::jsonb,              null,                   null),
  ('CARE-INSOLE-001',  'Demo Fresh Insole 1',      'shoe_care', 'insole',         'unisex', null,       'US 7-12', 14.99, '/images/products/placeholder-care.svg', 'Synthetic demo cushioning insole for freshness.',             '["Odor control","Extra cushion"]'::jsonb,         null,                   null),
  ('CARE-SPRAY-001',   'Demo Water Repellent Spray 1','shoe_care','protector',    'unisex', null,       null,      11.99, '/images/products/placeholder-care.svg', 'Synthetic demo water-repellent protector spray.',             '["Water repellent","Stain guard"]'::jsonb,        null,                   null);

-- -----------------------------------------------------------------------------
-- Product sources: one synthetic_demo provenance record per product
-- -----------------------------------------------------------------------------
insert into public.product_sources
  (product_id, source_type, source_region, permission_status, captured_at, approval_status, notes)
select id, 'synthetic_demo', 'DEMO', 'not_required', now(), 'demo', 'Seeded synthetic demo record.'
from public.products;

-- -----------------------------------------------------------------------------
-- Product relationships (approved demo edges, active=true)
--   upgrade_to(3) alternative_to(2) pairs_with(5) recommended_add_on(3)
--   lower_price_option(2) higher_price_option(2) best_for_activity(5)
--   recommended_for_customer_need(5)  = 27
-- -----------------------------------------------------------------------------
insert into public.product_relationships
  (source_product_id, target_product_id, relationship_type, priority, reason, customer_benefit, activity_type, customer_need, active)
select s.id, t.id, v.rtype, v.prio, v.reason, v.benefit, v.activity, v.need, true
from (values
  -- upgrade_to
  ('SHOE-WALK-001','SHOE-WALK-002','upgrade_to',        1, 'Premium walking upgrade with more cushioning.',    'Softer, longer-lasting comfort on long walks.',   'walking','walking'),
  ('SHOE-WORK-001','SHOE-WORK-002','upgrade_to',        1, 'Upgraded work shoe with enhanced support.',        'More protection and comfort across long shifts.', 'work','work_long_hours'),
  ('SHOE-BUDGET-001','SHOE-WALK-001','upgrade_to',      1, 'Step up from the budget option.',                  'More cushioning and durability for a bit more.',  'walking','walking'),
  -- alternative_to
  ('SHOE-WALK-001','SHOE-EVERYDAY-001','alternative_to',2, 'Similar comfort in an easy slip-on style.',        'Easy on-and-off with all-day comfort.',           'everyday','everyday_comfort'),
  ('SHOE-FIT-001', 'SHOE-MAXC-001','alternative_to',    2, 'Alternative with maximum cushioning.',             'A softer ride if plushness is preferred.',        'walking','maximum_cushioning'),
  -- pairs_with (socks)
  ('SHOE-WALK-001','SOCK-PERF-001','pairs_with',        1, 'Pairs with performance socks.',                    'Moisture control keeps feet dry on walks.',       null,'walking'),
  ('SHOE-WORK-001','SOCK-CREW-001','pairs_with',        1, 'Pairs with everyday crew socks.',                  'Cushioned comfort through long shifts.',          null,'work_long_hours'),
  ('SHOE-FIT-001', 'SOCK-PERF-002','pairs_with',        1, 'Pairs with cushioned performance socks.',          'Blister protection during training.',             null,'fitness'),
  ('SHOE-MAXC-001','SOCK-ANKLE-001','pairs_with',       1, 'Pairs with cushioned ankle socks.',                'Adds to the plush underfoot feel.',               null,'maximum_cushioning'),
  ('SHOE-EVERYDAY-001','SOCK-NOSHOW-001','pairs_with',  1, 'Pairs with no-show socks.',                        'Keeps the clean slip-on look.',                   null,'style'),
  -- recommended_add_on (shoe care)
  ('SHOE-WALK-001','CARE-KIT-001','recommended_add_on', 1, 'Add a shoe-care kit.',                             'Keeps shoes looking new for longer.',             null,null),
  ('SHOE-WORK-001','CARE-INSOLE-001','recommended_add_on',1,'Add fresh insoles.',                              'Extra freshness and cushioning for long hours.',  null,'work_long_hours'),
  ('SHOE-TRAVEL-001','CARE-SPRAY-001','recommended_add_on',1,'Add water-repellent spray.',                     'Protects shoes against travel weather.',          null,'travel'),
  -- lower_price_option
  ('SHOE-WALK-002','SHOE-BUDGET-001','lower_price_option',2,'A lower-price walking option.',                   'Everyday comfort at a friendlier price.',         'walking','budget'),
  ('SHOE-WORK-002','SHOE-WORK-001','lower_price_option', 2, 'A lower-price work option.',                       'Solid comfort for less.',                         'work','budget'),
  -- higher_price_option
  ('SHOE-BUDGET-001','SHOE-MAXC-001','higher_price_option',2,'A higher-tier cushioned shoe.',                  'The softest ride for all-day wear.',              'walking','maximum_cushioning'),
  ('SHOE-WALK-001','SHOE-WALK-002','higher_price_option',2, 'A premium walking upgrade.',                       'More cushioning and durability.',                 'walking','walking'),
  -- best_for_activity
  ('SHOE-EVERYDAY-001','SHOE-WALK-001','best_for_activity',1,'Best for walking.',                              'Purpose-built walking comfort.',                  'walking','walking'),
  ('SHOE-EVERYDAY-001','SHOE-FIT-001','best_for_activity',1,'Best for fitness.',                               'Support and rebound for training.',               'fitness','fitness'),
  ('SHOE-EVERYDAY-001','SHOE-WORK-001','best_for_activity',1,'Best for long work hours.',                      'Slip resistance and cushioning.',                 'work','work_long_hours'),
  ('SHOE-EVERYDAY-001','SHOE-TRAVEL-001','best_for_activity',1,'Best for travel.',                             'Lightweight and easy to pack.',                   'travel','travel'),
  ('SHOE-EVERYDAY-001','SHOE-MAXC-001','best_for_activity',1,'Best for maximum cushioning.',                   'Plush, cloud-like softness.',                     'cushioning','maximum_cushioning'),
  -- recommended_for_customer_need
  ('SHOE-STYLE-001','SHOE-WALK-001','recommended_for_customer_need',1,'Recommended for walking needs.',        'Comfort for extended walking.',                   'walking','walking'),
  ('SHOE-STYLE-001','SHOE-FIT-001','recommended_for_customer_need',1,'Recommended for fitness needs.',         'Performance for training.',                       'fitness','fitness'),
  ('SHOE-STYLE-001','SHOE-WORK-002','recommended_for_customer_need',1,'Recommended for long work hours.',      'Support for long shifts.',                        'work','work_long_hours'),
  ('SHOE-STYLE-001','SHOE-MAXC-001','recommended_for_customer_need',1,'Recommended for maximum cushioning.',   'The plushest option.',                            'cushioning','maximum_cushioning'),
  ('SHOE-STYLE-001','SHOE-BUDGET-001','recommended_for_customer_need',1,'Recommended for budget needs.',       'Great value at a lower price.',                   'walking','budget')
) as v(src_sku, tgt_sku, rtype, prio, reason, benefit, activity, need)
join public.products s on s.sku = v.src_sku
join public.products t on t.sku = v.tgt_sku;

-- -----------------------------------------------------------------------------
-- Phase 5 recommendation-coverage expansion (synthetic demo)
-- Ensures five demo shoes each have a full slottable set (upgrade + alternative
-- + socks/shoe-care add-on) plus best_for_activity + recommended_for_customer_need:
--   Demo Walk Comfort 1, Demo Work Cushion 1, Demo Sport Fit Runner 1,
--   Demo Everyday Comfort 1, Demo Trail Active 1.
-- All demo data; no self-references; no duplicate (source,target,type) edges.
-- -----------------------------------------------------------------------------
insert into public.product_relationships
  (source_product_id, target_product_id, relationship_type, priority, reason, customer_benefit, activity_type, customer_need, active)
select s.id, t.id, v.rtype, v.prio, v.reason, v.benefit, v.activity, v.need, true
from (values
  -- Demo Walk Comfort 1: already has upgrade/alt/add-on; add the remaining types
  ('SHOE-WALK-001','SHOE-MAXC-001','best_for_activity',2,'Best for cushioned walking.','Extra-soft ride for long walks.','walking','walking'),
  ('SHOE-WALK-001','SHOE-WALK-002','recommended_for_customer_need',3,'Recommended for walking needs.','Premium comfort matched to walking.','walking','walking'),
  -- Demo Work Cushion 1: add the missing alternative + remaining types
  ('SHOE-WORK-001','SHOE-EVERYDAY-001','alternative_to',2,'A slip-on alternative for work.','Easy on/off with all-day comfort.','everyday','work_long_hours'),
  ('SHOE-WORK-001','SHOE-WORK-002','best_for_activity',2,'Best for long work shifts.','Slip resistance and cushioning.','work','work_long_hours'),
  ('SHOE-WORK-001','SHOE-WORK-002','recommended_for_customer_need',3,'Recommended for long hours on your feet.','Support across long shifts.','work','work_long_hours'),
  -- Demo Sport Fit Runner 1: add the missing upgrade + shoe-care add-on + remaining types
  ('SHOE-FIT-001','SHOE-FIT-002','upgrade_to',1,'Upgrade to the pro trainer.','More rebound and stability for tougher workouts.','fitness','fitness'),
  ('SHOE-FIT-001','CARE-INSOLE-001','recommended_add_on',1,'Add fresh insoles.','Extra freshness for gym days.',null,'fitness'),
  ('SHOE-FIT-001','SHOE-MAXC-001','best_for_activity',2,'Best for cushioned training.','Softer landings during workouts.','fitness','fitness'),
  ('SHOE-FIT-001','SHOE-FIT-002','recommended_for_customer_need',3,'Recommended for fitness needs.','Performance for training.','fitness','fitness'),
  -- Demo Everyday Comfort 1 (new): full set
  ('SHOE-EVERYDAY-002','SHOE-WALK-002','upgrade_to',1,'Upgrade to premium cushioning.','Softer, longer-lasting comfort.','everyday','everyday_comfort'),
  ('SHOE-EVERYDAY-002','SHOE-EVERYDAY-001','alternative_to',2,'A slip-on alternative.','Easy on/off everyday wear.','everyday','everyday_comfort'),
  ('SHOE-EVERYDAY-002','SOCK-NOSHOW-001','pairs_with',1,'Pairs with no-show socks.','Clean look with everyday shoes.',null,'everyday_comfort'),
  ('SHOE-EVERYDAY-002','CARE-KIT-001','recommended_add_on',1,'Add a shoe-care kit.','Keeps everyday shoes fresh.',null,null),
  ('SHOE-EVERYDAY-002','SHOE-WALK-001','best_for_activity',2,'Best for everyday walking.','Comfort for daily wear.','walking','everyday_comfort'),
  ('SHOE-EVERYDAY-002','SHOE-WALK-001','recommended_for_customer_need',3,'Recommended for everyday comfort.','All-day softness.','everyday','everyday_comfort'),
  -- Demo Trail Active 1 (new): full set
  ('SHOE-TRAIL-001','SHOE-MAXC-001','upgrade_to',1,'Upgrade to maximum cushioning.','Plusher ride on long trails.','trail','maximum_cushioning'),
  ('SHOE-TRAIL-001','SHOE-FIT-001','alternative_to',2,'A road-runner alternative.','Lighter option for mixed terrain.','fitness','fitness'),
  ('SHOE-TRAIL-001','SOCK-PERF-001','pairs_with',1,'Pairs with performance socks.','Moisture control on the trail.',null,'fitness'),
  ('SHOE-TRAIL-001','CARE-SPRAY-001','recommended_add_on',1,'Add water-repellent spray.','Protects against trail weather.',null,'travel'),
  ('SHOE-TRAIL-001','SHOE-WALK-001','best_for_activity',2,'Best for active walking.','Rugged comfort off-road.','trail','walking'),
  ('SHOE-TRAIL-001','SHOE-FIT-001','recommended_for_customer_need',3,'Recommended for fitness needs.','Support for active use.','fitness','fitness')
) as v(src_sku, tgt_sku, rtype, prio, reason, benefit, activity, need)
join public.products s on s.sku = v.src_sku
join public.products t on t.sku = v.tgt_sku;

-- -----------------------------------------------------------------------------
-- Recommendation approvals: demo approval records for the upgrade relationships
-- -----------------------------------------------------------------------------
insert into public.recommendation_approvals (relationship_id, approval_status, approved_by, approved_at, notes)
select r.id, 'demo', 'demo_seed', now(), 'Auto-approved demo relationship.'
from public.product_relationships r
where r.relationship_type = 'upgrade_to';

-- -----------------------------------------------------------------------------
-- Store (1 demo store)
-- -----------------------------------------------------------------------------
insert into public.stores (name, location, region)
values ('Demo Store 1', 'Demo Mall, Demo City', 'DEMO');

-- -----------------------------------------------------------------------------
-- Inventory for the demo store: sizes per category, varied demo availability
-- -----------------------------------------------------------------------------
with base as (
  select
    p.id  as product_id,
    p.sku as sku,
    p.category,
    sz.size,
    abs(hashtext(p.sku || coalesce(sz.size, 'NA'))) as h
  from public.products p
  cross join lateral unnest(
    case
      when p.category = 'socks'     then array['S/M', 'L/XL']
      when p.category = 'shoe_care' then array[null]::text[]
      else array['8', '9', '10', '11']
    end
  ) as sz(size)
)
insert into public.inventory (product_id, store_id, size, quantity, availability_status)
select
  base.product_id,
  (select id from public.stores where name = 'Demo Store 1' limit 1),
  base.size,
  case when base.h % 11 = 0 then 0 else 5 + (base.h % 40) end,
  case
    when base.h % 11 = 0 then 'demo_out'
    when base.h % 5  = 0 then 'demo_low'
    else 'demo_available'
  end
from base;

-- -----------------------------------------------------------------------------
-- A few demo recommendation events (anonymous — no PII)
-- -----------------------------------------------------------------------------
insert into public.recommendation_events
  (selected_product_id, recommended_product_id, relationship_id, customer_need_id, store_id, action, sale_completed)
select
  sp.id, rp.id, rel.id, cn.id,
  (select id from public.stores where name = 'Demo Store 1' limit 1),
  v.action, v.sale
from (values
  ('SHOE-WALK-001','SHOE-WALK-002','upgrade_to',         'walking',         'presented',           false),
  ('SHOE-WALK-001','SOCK-PERF-001','pairs_with',         'walking',         'added_to_basket',     true),
  ('SHOE-WALK-001','CARE-KIT-001', 'recommended_add_on', null,              'displayed',           false),
  ('SHOE-WORK-001','SHOE-WORK-002','upgrade_to',         'work_long_hours', 'customer_interested', false),
  ('SHOE-FIT-001', 'SHOE-MAXC-001','alternative_to',     'maximum_cushioning','not_relevant',      false)
) as v(src_sku, tgt_sku, rtype, need_code, action, sale)
join public.products sp on sp.sku = v.src_sku
join public.products rp on rp.sku = v.tgt_sku
left join public.product_relationships rel
  on rel.source_product_id = sp.id
 and rel.target_product_id = rp.id
 and rel.relationship_type = v.rtype
left join public.customer_needs cn on cn.code = v.need_code;

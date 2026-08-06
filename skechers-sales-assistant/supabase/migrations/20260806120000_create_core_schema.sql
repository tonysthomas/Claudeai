-- =============================================================================
-- Skechers Sales Assistant — Core schema (Step 2)
-- Migration: create_core_schema
--
-- Creates the database foundation: products, product_relationships,
-- customer_needs, recommendation_events, stores, inventory — with constraints,
-- indexes, updated_at triggers, and Row Level Security.
--
-- SYNTHETIC DEMO DATA ONLY. No real Skechers catalogue data. Defaults are
-- 'DEMO' / 'synthetic_demo' / 'demo' so prototype records are unmistakably
-- non-production.
--
-- Portable: runs on Supabase (Postgres) and on a plain local Postgres used for
-- validation. Supabase-specific role grants (anon/authenticated) are applied
-- only if those roles exist.
-- =============================================================================

-- gen_random_uuid() is in core Postgres 13+, but ensure pgcrypto for safety.
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- updated_at trigger helper
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- 1. products
-- =============================================================================
create table public.products (
  id              uuid primary key default gen_random_uuid(),
  sku             text not null unique,
  barcode         text,
  style_number    text,
  name            text not null,
  category        text not null,
  subcategory     text,
  gender          text,
  color           text,
  size_range      text,
  price           numeric(10, 2),
  currency        text not null default 'DEMO',
  region          text not null default 'DEMO',
  image_url       text,
  description     text,
  key_features    jsonb,
  technology      text,
  activity_type   text,
  source          text not null default 'synthetic_demo',
  source_url      text,
  approval_status text not null default 'demo'
                    check (approval_status in
                      ('draft', 'demo', 'pending_review', 'approved', 'rejected', 'archived')),
  imported_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table  public.products is 'Product catalogue. Synthetic demo data during prototyping (approval_status=demo).';
comment on column public.products.approval_status is 'draft | demo | pending_review | approved | rejected | archived. Only approved rows are production-usable.';
comment on column public.products.source is 'Record provenance. Defaults to synthetic_demo for prototype data.';

-- barcode is unique only when present (many demo rows may omit it)
create unique index products_barcode_unique
  on public.products (barcode)
  where barcode is not null;

create index products_category_idx      on public.products (category);
create index products_activity_type_idx on public.products (activity_type);
-- products.sku already indexed by the UNIQUE constraint (products_sku_key).

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 2. product_relationships
--    The core recommendation-rule table: a typed, approved link from a source
--    product to a recommended target product, with the approved reason and
--    customer benefit shown to the associate.
-- =============================================================================
create table public.product_relationships (
  id                uuid primary key default gen_random_uuid(),
  source_product_id uuid not null references public.products (id) on delete cascade,
  target_product_id uuid not null references public.products (id) on delete cascade,
  relationship_type text not null
                      check (relationship_type in
                        ('upgrade_to', 'alternative_to', 'pairs_with', 'recommended_add_on',
                         'lower_price_option', 'higher_price_option', 'best_for_activity')),
  priority          integer not null default 1 check (priority > 0),
  reason            text not null,
  customer_benefit  text not null,
  activity_type     text,
  customer_need     text,
  approved          boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- a product cannot relate to itself
  constraint product_relationships_no_self_ref
    check (source_product_id <> target_product_id),
  -- no duplicate source→target of the same relationship type
  constraint product_relationships_unique_edge
    unique (source_product_id, target_product_id, relationship_type)
);

comment on table public.product_relationships is 'Approved, typed recommendation edges between products. reason/customer_benefit are curated copy — never generated at runtime.';

create index product_relationships_source_idx on public.product_relationships (source_product_id);
create index product_relationships_target_idx on public.product_relationships (target_product_id);
create index product_relationships_type_idx   on public.product_relationships (relationship_type);

create trigger product_relationships_set_updated_at
  before update on public.product_relationships
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 3. customer_needs  (canonical, reference data — inserted here)
-- =============================================================================
create table public.customer_needs (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.customer_needs is 'The approved customer-need categories used to steer recommendations.';

insert into public.customer_needs (code, name, description) values
  ('everyday_comfort',   'Everyday comfort',   'General all-day comfort for casual wear.'),
  ('walking',            'Walking',            'Comfort and support for extended walking.'),
  ('work_long_hours',    'Work or long hours', 'Cushioning and support for long shifts on your feet.'),
  ('fitness',            'Fitness',            'Performance and stability for training and gym.'),
  ('travel',             'Travel',             'Lightweight, easy-on comfort for travel.'),
  ('style',              'Style',              'Fashion-forward look for everyday style.'),
  ('budget',             'Budget',             'Best value at a lower price point.'),
  ('maximum_cushioning', 'Maximum cushioning', 'Maximum underfoot softness and impact absorption.'),
  ('support',            'Support',            'Enhanced arch and stability support.')
on conflict (code) do nothing;

-- =============================================================================
-- 4. recommendation_events  (anonymous interaction/outcome log — no PII)
-- =============================================================================
create table public.recommendation_events (
  id                    uuid primary key default gen_random_uuid(),
  selected_product_id   uuid not null references public.products (id) on delete cascade,
  recommended_product_id uuid not null references public.products (id) on delete cascade,
  relationship_id       uuid references public.product_relationships (id) on delete set null,
  customer_need_id      uuid references public.customer_needs (id) on delete set null,
  associate_id          uuid,
  store_id              uuid,
  action                text not null
                          check (action in
                            ('displayed', 'opened', 'presented', 'customer_interested',
                             'added_to_basket', 'customer_declined', 'product_unavailable',
                             'not_relevant')),
  sale_completed        boolean not null default false,
  created_at            timestamptz not null default now()
);

comment on table public.recommendation_events is 'Anonymous log of what was recommended and the outcome. No customer PII. associate_id/store_id are optional and unconstrained until Phase 6 auth.';

create index recommendation_events_selected_idx on public.recommendation_events (selected_product_id);
create index recommendation_events_created_idx  on public.recommendation_events (created_at);

-- =============================================================================
-- 5. stores
-- =============================================================================
create table public.stores (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  location   text,
  region     text not null default 'DEMO',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.stores is 'Demo store context. No real store data during prototyping.';

-- =============================================================================
-- 6. inventory
-- =============================================================================
create table public.inventory (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.products (id) on delete cascade,
  store_id            uuid not null references public.stores (id) on delete cascade,
  size                text,
  quantity            integer not null default 0,
  availability_status text not null default 'demo_available',
  updated_at          timestamptz not null default now()
);

comment on table public.inventory is 'Demo, static inventory per product/store/size. Not connected to any POS/inventory system.';

-- prevent duplicate product/store/size (COALESCE handles NULL size as one bucket)
create unique index inventory_product_store_size_unique
  on public.inventory (product_id, store_id, (coalesce(size, '')));

create index inventory_product_idx on public.inventory (product_id);
create index inventory_store_idx   on public.inventory (store_id);

create trigger inventory_set_updated_at
  before update on public.inventory
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Row Level Security
--
-- RLS is ENABLED on every table (default-deny). Read access to the demo
-- catalogue/reference tables is granted to everyone (public) because that data
-- is non-sensitive synthetic demo content that the future read-only frontend
-- must display.
--
-- recommendation_events has NO public policy yet → default-deny. Writes are
-- performed by privileged/server roles during seeding and the demo; a narrow,
-- validated insert policy is added in Phase 5 (Outcome logging). No table is
-- world-writable.
-- =============================================================================
alter table public.products              enable row level security;
alter table public.product_relationships enable row level security;
alter table public.customer_needs        enable row level security;
alter table public.recommendation_events enable row level security;
alter table public.stores                enable row level security;
alter table public.inventory             enable row level security;

-- Read-only public policies for the demo catalogue/reference tables.
create policy products_read_all              on public.products              for select using (true);
create policy product_relationships_read_all on public.product_relationships for select using (true);
create policy customer_needs_read_all        on public.customer_needs        for select using (true);
create policy stores_read_all                on public.stores                for select using (true);
create policy inventory_read_all             on public.inventory             for select using (true);

-- Supabase exposes tables to the anon/authenticated roles via GRANTs. Apply
-- them only if those roles exist (they do on Supabase; they don't on a plain
-- local validation Postgres).
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant usage on schema public to anon;
    grant select on public.products, public.product_relationships,
                     public.customer_needs, public.stores, public.inventory to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant usage on schema public to authenticated;
    grant select on public.products, public.product_relationships,
                     public.customer_needs, public.stores, public.inventory to authenticated;
  end if;
end
$$;

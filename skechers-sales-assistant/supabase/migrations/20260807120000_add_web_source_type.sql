-- =============================================================================
-- Skechers Sales Assistant — add 'skechers_official_web' source type (Method 1)
--
-- Method 1 (Real Skechers Product Ingestion & Web Connector) imports authorized
-- official product records through the Phase 3 catalogue pipeline. Those records
-- carry source_type = 'skechers_official_web' so their provenance is explicit and
-- auditable, distinct from generic 'website' / 'catalogue' imports.
--
-- IMPORTANT: this only ADDS an allowed enum value. It does not change how data is
-- obtained — ingestion runs through the backend pipeline (scripts/), never from
-- the app UI, and never via live scraping. See database/GOVERNANCE.md.
-- Portable: plain CHECK-constraint swaps; no Supabase-only objects.
-- =============================================================================

alter table public.products        drop constraint if exists products_source_type_check;
alter table public.products
  add constraint products_source_type_check
  check (source_type in ('website', 'catalogue', 'api_feed', 'manual', 'synthetic_demo', 'skechers_official_web'));

alter table public.product_sources drop constraint if exists product_sources_source_type_check;
alter table public.product_sources
  add constraint product_sources_source_type_check
  check (source_type in ('website', 'catalogue', 'api_feed', 'manual', 'synthetic_demo', 'skechers_official_web'));

alter table public.catalogue_imports drop constraint if exists catalogue_imports_source_type_check;
alter table public.catalogue_imports
  add constraint catalogue_imports_source_type_check
  check (source_type in ('website', 'catalogue', 'api_feed', 'manual', 'synthetic_demo', 'skechers_official_web'));

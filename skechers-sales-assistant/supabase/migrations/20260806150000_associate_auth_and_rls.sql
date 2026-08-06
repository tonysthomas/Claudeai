-- =============================================================================
-- Skechers Sales Assistant — Associate auth + store context + RLS (Phase 6)
--
-- Adds associate_profiles (linked to Supabase auth), portable auth/demo helper
-- functions, and tightens recommendation_events writes:
--   * authenticated associates may insert events only for THEMSELVES and their
--     assigned store (no arbitrary associate_id/store_id);
--   * anonymous inserts are allowed ONLY in demo mode (GUC app.demo_mode='true')
--     and are blocked in production;
--   * associates cannot update/delete events (no such policy = default deny).
--
-- Portable: uses GUC-based helpers instead of hard dependencies on the Supabase
-- `auth` schema, so it applies on vanilla Postgres (validation) and Supabase.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Auth / demo helper functions (portable)
-- -----------------------------------------------------------------------------

-- The authenticated user's id, taken from the request JWT ("sub"). NULL when
-- unauthenticated. Mirrors Supabase's auth.uid() without depending on it.
create or replace function public.app_current_uid()
returns uuid
language plpgsql
stable
as $$
declare claims text;
begin
  claims := current_setting('request.jwt.claims', true);
  if claims is null or claims = '' then return null; end if;
  return (claims::jsonb ->> 'sub')::uuid;
exception when others then
  return null;
end;
$$;

-- True only when the database is explicitly in demo mode (local/testing). The
-- GUC is set by seed.sql for local/demo databases and is unset in production.
create or replace function public.app_demo_mode()
returns boolean
language sql
stable
as $$
  select coalesce(current_setting('app.demo_mode', true), 'false') = 'true';
$$;

-- =============================================================================
-- associate_profiles
-- =============================================================================
create table public.associate_profiles (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid not null unique,   -- logically links to auth.users(id)
  employee_number text not null unique,
  display_name    text,
  store_id        uuid references public.stores (id) on delete set null,
  role            text not null default 'associate',
  language        text not null default 'en',
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table  public.associate_profiles is 'Store associate identities. auth_user_id links to Supabase auth.users(id); no customer PII.';
comment on column public.associate_profiles.auth_user_id is 'Supabase auth user id (JWT sub). In production, provisioned from auth.users; logically linked (no hard FK so demo data can seed without an auth row).';

create index associate_profiles_store_idx on public.associate_profiles (store_id);

create trigger associate_profiles_set_updated_at
  before update on public.associate_profiles
  for each row execute function public.set_updated_at();

-- The current associate's assigned store (SECURITY DEFINER so the recommendation
-- events insert check can read it without recursing through RLS).
create or replace function public.current_associate_store()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select store_id from public.associate_profiles
   where auth_user_id = public.app_current_uid() and active
   limit 1;
$$;

-- =============================================================================
-- RLS: associate_profiles — associates read only their own profile (or demo).
-- =============================================================================
alter table public.associate_profiles enable row level security;

create policy associate_profiles_read_own
  on public.associate_profiles
  for select
  using (auth_user_id = public.app_current_uid() or public.app_demo_mode());

-- =============================================================================
-- RLS: recommendation_events — replace the blanket demo insert with a narrow
-- authenticated policy + a demo-gated anonymous policy. Still no update/delete.
-- =============================================================================
drop policy if exists recommendation_events_demo_insert on public.recommendation_events;

-- Authenticated associates: only their own id and their assigned store.
create policy recommendation_events_associate_insert
  on public.recommendation_events
  for insert
  with check (
    public.app_current_uid() is not null
    and associate_id = public.app_current_uid()
    and store_id is not distinct from public.current_associate_store()
  );

-- Anonymous demo inserts: only in demo mode, and only PII-free (no associate).
create policy recommendation_events_demo_insert
  on public.recommendation_events
  for insert
  with check (public.app_demo_mode() and associate_id is null);

-- =============================================================================
-- Grants (Supabase roles only; applied if the roles exist)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant usage on schema public to authenticated;
    grant select on public.associate_profiles to authenticated;
    grant insert on public.recommendation_events to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant insert on public.recommendation_events to anon;
    -- anon may read its own (demo) profile row set; demo mode gates visibility
    grant select on public.associate_profiles to anon;
  end if;
end
$$;

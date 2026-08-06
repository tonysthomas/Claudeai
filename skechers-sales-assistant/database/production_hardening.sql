-- =============================================================================
-- Skechers Sales Assistant — PRODUCTION HARDENING (template, NOT auto-applied)
--
-- This file is intentionally OUTSIDE supabase/migrations/ so it is never applied
-- by the demo/validation runner. Apply it (reviewed, as a real timestamped
-- migration) as part of the production go-live, together with the pre-flight
-- checklist in database/GOVERNANCE.md.
--
-- It tightens the DEMO read posture for real (authorized) catalogue data:
--   1. Removes the public/anonymous read policies on the catalogue tables and
--      replaces them with authenticated-only reads.
--   2. Clears the demo-mode GUC so the demo bypass can never evaluate true.
--   3. (Optional) Documents the auth.users linkage options for associate_profiles.
--
-- Review every step for your deployment before running. Do NOT run the demo
-- seed (supabase/seed.sql) in production.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Lock anonymous catalogue reads.
--    In the demo, products/relationships/etc. are world-readable because they
--    are synthetic. Real approved catalogue data must be readable only by a
--    signed-in associate (or a narrower, store-scoped policy of your choosing).
-- -----------------------------------------------------------------------------
drop policy if exists products_read_all              on public.products;
drop policy if exists product_sources_read_all       on public.product_sources;
drop policy if exists product_relationships_read_all on public.product_relationships;
drop policy if exists customer_needs_read_all        on public.customer_needs;
drop policy if exists stores_read_all                on public.stores;
drop policy if exists inventory_read_all             on public.inventory;

create policy products_read_authed
  on public.products for select using (public.app_current_uid() is not null);
create policy product_sources_read_authed
  on public.product_sources for select using (public.app_current_uid() is not null);
create policy product_relationships_read_authed
  on public.product_relationships for select using (public.app_current_uid() is not null);
create policy customer_needs_read_authed
  on public.customer_needs for select using (public.app_current_uid() is not null);
create policy stores_read_authed
  on public.stores for select using (public.app_current_uid() is not null);
create policy inventory_read_authed
  on public.inventory for select using (public.app_current_uid() is not null);

-- Revoke the anon SELECT grants issued for the demo (authenticated keeps read).
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke select on public.products, public.product_sources, public.product_relationships,
                     public.customer_needs, public.stores, public.inventory from anon;
    -- The demo anonymous event-insert + profile-read grants are demo-only too.
    revoke insert on public.recommendation_events from anon;
    revoke select on public.associate_profiles     from anon;
  end if;
end
$$;

-- The demo-gated anonymous insert policy can never pass once the GUC is unset,
-- but drop it in production so the intent is explicit.
drop policy if exists recommendation_events_demo_insert on public.recommendation_events;

-- -----------------------------------------------------------------------------
-- 2. Ensure the demo-mode GUC is not set on the production database.
--    (Belt-and-braces: the production DB should never have had it set, because
--    the demo seed is the only thing that sets it and must not run in prod.)
-- -----------------------------------------------------------------------------
do $$
begin
  execute format('alter database %I reset app.demo_mode', current_database());
end
$$;

-- -----------------------------------------------------------------------------
-- 3. associate_profiles ↔ auth.users linkage (choose ONE; both require the
--    Supabase `auth` schema, so they live here rather than in the portable
--    migration). Uncomment the option you adopt.
--
-- Option A — hard foreign key (delete profile when the auth user is deleted):
--   alter table public.associate_profiles
--     add constraint associate_profiles_auth_user_fk
--     foreign key (auth_user_id) references auth.users (id) on delete cascade;
--
-- Option B — provision a profile automatically on user creation (trigger):
--   create or replace function public.handle_new_auth_user()
--   returns trigger language plpgsql security definer set search_path = public as $fn$
--   begin
--     insert into public.associate_profiles (auth_user_id, employee_number, display_name)
--     values (new.id, coalesce(new.raw_user_meta_data->>'employee_number', new.email), new.raw_user_meta_data->>'display_name')
--     on conflict (auth_user_id) do nothing;
--     return new;
--   end;
--   $fn$;
--   create trigger on_auth_user_created
--     after insert on auth.users
--     for each row execute function public.handle_new_auth_user();
-- -----------------------------------------------------------------------------

commit;

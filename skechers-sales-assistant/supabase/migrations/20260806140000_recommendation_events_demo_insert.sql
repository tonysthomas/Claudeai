-- =============================================================================
-- Skechers Sales Assistant — recommendation_events demo insert policy (Phase 5)
--
-- Lets the demo frontend log recommendation display/interaction events. It is
-- NARROW and PII-free: inserts are allowed only when associate_id IS NULL (no
-- associate attribution during the demo). No SELECT is granted.
--
-- DEMO policy: the pre-production security review (Phase 10, "who can write
-- recommendation events") will tighten this before production.
-- =============================================================================

create policy recommendation_events_demo_insert
  on public.recommendation_events
  for insert
  to public
  with check (associate_id is null);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant insert on public.recommendation_events to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant insert on public.recommendation_events to authenticated;
  end if;
end
$$;

-- ============================================================
-- Migración 008 — Hardening de policies + índices
-- Correr COMPLETO en el Supabase SQL Editor. Idempotente.
--
-- 1. Escrituras sensibles pasan a ser solo-Admin:
--    - pipeline_stages: cualquier autenticado podía renombrar/borrar etapas
--    - organization: cualquier autenticado podía cambiar nombre/CUIT/dólar
--    - activities DELETE: cualquier autenticado podía borrar historial
--    (la app solo expone estas acciones al Admin; ahora la base también)
-- 2. Índices que faltaban para los joins/lecturas más comunes.
--
-- Requiere public.is_admin() (creada en policies_leads.sql).
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. pipeline_stages: lectura pública se mantiene, escritura Admin
-- ──────────────────────────────────────────────────────────────
drop policy if exists "Auth manage stages"   on public.pipeline_stages;
drop policy if exists "Stages admin insert"  on public.pipeline_stages;
drop policy if exists "Stages admin update"  on public.pipeline_stages;
drop policy if exists "Stages admin delete"  on public.pipeline_stages;

create policy "Stages admin insert" on public.pipeline_stages
  for insert with check (public.is_admin());
create policy "Stages admin update" on public.pipeline_stages
  for update using (public.is_admin()) with check (public.is_admin());
create policy "Stages admin delete" on public.pipeline_stages
  for delete using (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 2. organization: lectura autenticada se mantiene, escritura Admin
-- ──────────────────────────────────────────────────────────────
drop policy if exists "Auth update org"      on public.organization;
drop policy if exists "Auth insert org"      on public.organization;
drop policy if exists "Org admin update"     on public.organization;
drop policy if exists "Org admin insert"     on public.organization;

create policy "Org admin insert" on public.organization
  for insert with check (public.is_admin());
create policy "Org admin update" on public.organization
  for update using (public.is_admin()) with check (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 3. activities: borrar historial solo Admin
--    (insertar sigue abierto a autenticados: los agentes registran actividad)
-- ──────────────────────────────────────────────────────────────
drop policy if exists "Auth delete activities"   on public.activities;
drop policy if exists "Activities admin delete"  on public.activities;

create policy "Activities admin delete" on public.activities
  for delete using (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 4. Índices para joins y filtros frecuentes
-- ──────────────────────────────────────────────────────────────
create index if not exists leads_stage_idx          on public.leads(stage_id);
create index if not exists leads_agent_idx          on public.leads(agent_id);
create index if not exists leads_property_idx       on public.leads(property_id);
create index if not exists activities_lead_idx      on public.activities(lead_id);
create index if not exists activities_created_idx   on public.activities(created_at desc);
create index if not exists properties_status_idx    on public.properties(status);

-- ──────────────────────────────────────────────────────────────
-- 5. Limpieza: bucket viejo `property-images` (reemplazado por
--    `property-photos` en la migración 007 + storage SQL)
-- ──────────────────────────────────────────────────────────────
delete from storage.objects where bucket_id = 'property-images';
delete from storage.buckets where id = 'property-images';

-- ──────────────────────────────────────────────────────────────
-- VERIFICACIÓN — policies por tabla (revisar que las "Auth ..."
-- de stages/org/activities-delete ya no estén)
-- ──────────────────────────────────────────────────────────────
select tablename, policyname, cmd
  from pg_policies
 where schemaname = 'public'
   and tablename in ('pipeline_stages','organization','activities')
 order by tablename, cmd;

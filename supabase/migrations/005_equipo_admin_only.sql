-- ============================================================
-- Migración 005 — Escrituras sobre agents SOLO para Admin
-- Correr COMPLETO en el Supabase SQL Editor. Idempotente.
--
-- Hasta ahora cualquier usuario autenticado podía editar/borrar
-- agentes vía API pública de Supabase (las policies eran
-- "authenticated = todo"). Ahora solo el Admin escribe.
--
-- Requiere public.is_admin() (creada en policies_leads.sql).
-- Los flujos de invitación/registro no se ven afectados:
-- usan triggers security definer o el service role.
-- ============================================================

drop policy if exists "Auth insert agents"    on public.agents;
drop policy if exists "Auth update agents"    on public.agents;
drop policy if exists "Auth delete agents"    on public.agents;
drop policy if exists "Agents admin insert"   on public.agents;
drop policy if exists "Agents admin update"   on public.agents;
drop policy if exists "Agents admin delete"   on public.agents;

-- Lectura sigue abierta a autenticados ("Auth read agents" de 001/002):
-- la app necesita listar agentes en selectores, ranking, etc.

create policy "Agents admin insert" on public.agents
  for insert with check (public.is_admin());

create policy "Agents admin update" on public.agents
  for update using (public.is_admin()) with check (public.is_admin());

create policy "Agents admin delete" on public.agents
  for delete using (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- VERIFICACIÓN — debe listar exactamente:
--   Auth read agents (SELECT) + las 3 "Agents admin ..."
-- ──────────────────────────────────────────────────────────────
select policyname, cmd
  from pg_policies
 where schemaname = 'public' and tablename = 'agents'
 order by cmd;

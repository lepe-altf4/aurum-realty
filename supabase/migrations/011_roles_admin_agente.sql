-- ============================================================
-- Migración 011 — Roles: solo Admin y Agente
-- Correr COMPLETO en el Supabase SQL Editor. Idempotente.
--
-- Unifica los roles del equipo a dos: Admin (dueño, ve y aprueba todo) y
-- Agente (todo el resto). Los antiguos Senior/Junior pasan a Agente.
-- ============================================================

-- 1. Migrar datos existentes ANTES de cambiar el check
update public.agents set role = 'Agente' where role in ('Senior', 'Junior');

-- 2. Reemplazar el constraint
alter table public.agents drop constraint if exists agents_role_check;
alter table public.agents
  add constraint agents_role_check check (role in ('Admin', 'Agente'));

-- 3. Default del trigger de alta: ya asigna 'Agente' por defecto
--    (lepemate1310@gmail.com -> Admin). No requiere cambios.

-- 4. VERIFICACIÓN — solo deberían quedar Admin y Agente
select role, count(*) from public.agents group by role order by role;

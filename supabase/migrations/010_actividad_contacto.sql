-- ============================================================
-- Migración 010 — tipo de actividad "Contacto"
-- Correr COMPLETO en el Supabase SQL Editor. Idempotente.
--
-- Habilita el botón "Registré contacto" del lead: registra una actividad
-- de tipo Contacto (el trigger existente resetea days_without_contact a 0).
-- El front igual tiene fallback a 'Nota' si esta migración no corrió.
-- ============================================================

alter table public.activities
  drop constraint if exists activities_type_check;

alter table public.activities
  add constraint activities_type_check
  check (type in ('Nota','Llamada','Email','WhatsApp','Visita','Cambio_etapa','Contacto'));

-- VERIFICACIÓN
select conname, pg_get_constraintdef(oid)
  from pg_constraint
 where conrelid = 'public.activities'::regclass and conname = 'activities_type_check';

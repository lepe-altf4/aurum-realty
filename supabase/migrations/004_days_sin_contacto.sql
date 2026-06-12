-- ============================================================
-- Migración 004 — days_without_contact REAL
-- Correr COMPLETO en el Supabase SQL Editor. Idempotente.
--
-- Hasta ahora days_without_contact era un número sembrado a mano.
-- Ahora se deriva de actividad real:
--   last_contact_at = último registro en activities
--                     (o updated_at/created_at si nunca hubo actividad)
--   days_without_contact = días entre hoy y last_contact_at
--
-- Mecánica:
--   1. Trigger en activities → al registrar contacto, el lead
--      vuelve a 0 al instante.
--   2. refresh_days_without_contact() recalcula todos los leads.
--      La llama un cron diario de Vercel (/api/leads/refresh-contact)
--      y también se ejecuta al final de este script.
--
-- Por qué columna + trigger y no una vista: toda la app lee
-- leads.days_without_contact directo (5 pantallas) y las policies
-- RLS cuelgan de la tabla; una vista obligaría a reescribir todo.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Columna last_contact_at (sin default primero para poder
--    backfillear los registros existentes con su valor real)
-- ──────────────────────────────────────────────────────────────
alter table public.leads
  add column if not exists last_contact_at timestamptz;

update public.leads l
   set last_contact_at = coalesce(
         (select max(a.created_at) from public.activities a where a.lead_id = l.id),
         l.updated_at,
         l.created_at
       )
 where l.last_contact_at is null;

-- Leads nuevos: cuentan desde su creación
alter table public.leads
  alter column last_contact_at set default now();

create index if not exists leads_last_contact_at_idx on public.leads(last_contact_at);

-- ──────────────────────────────────────────────────────────────
-- 2. Trigger: cada actividad nueva marca contacto y resetea a 0
--    (security definer: el agente puede registrar actividad sobre
--    un lead que no puede editar directamente, p.ej. del pozo)
-- ──────────────────────────────────────────────────────────────
create or replace function public.touch_lead_last_contact()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.lead_id is not null then
    update public.leads
       set last_contact_at = greatest(coalesce(last_contact_at, new.created_at), new.created_at),
           days_without_contact = 0
     where id = new.lead_id;
  end if;
  return new;
end;
$$;

drop trigger if exists activities_touch_lead on public.activities;
create trigger activities_touch_lead
  after insert on public.activities
  for each row execute procedure public.touch_lead_last_contact();

-- ──────────────────────────────────────────────────────────────
-- 3. Recalculo masivo (lo llama el cron diario de Vercel)
--    Devuelve cuántos leads cambiaron.
-- ──────────────────────────────────────────────────────────────
create or replace function public.refresh_days_without_contact()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_updated integer;
begin
  with calc as (
    select id,
           greatest(
             0,
             floor(extract(epoch from (now() - coalesce(last_contact_at, updated_at, created_at))) / 86400)
           )::int as days
      from public.leads
  )
  update public.leads l
     set days_without_contact = c.days
    from calc c
   where c.id = l.id
     and l.days_without_contact is distinct from c.days;

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

-- Solo el backend (service role) lo ejecuta; no hace falta exponerlo
revoke execute on function public.refresh_days_without_contact() from public;
revoke execute on function public.refresh_days_without_contact() from anon;
revoke execute on function public.refresh_days_without_contact() from authenticated;
grant  execute on function public.refresh_days_without_contact() to service_role;

-- ──────────────────────────────────────────────────────────────
-- 4. Ejecutar ahora para que los números queden reales YA
-- ──────────────────────────────────────────────────────────────
select public.refresh_days_without_contact() as leads_actualizados;

-- ──────────────────────────────────────────────────────────────
-- 5. VERIFICACIÓN — "diferencia" debe ser 0 en todas las filas.
--    Compará a ojo: dias_guardados vs dias_calculados_ahora.
-- ──────────────────────────────────────────────────────────────
select l.name,
       l.days_without_contact                              as dias_guardados,
       greatest(0, floor(extract(epoch from (now() - l.last_contact_at)) / 86400))::int
                                                           as dias_calculados_ahora,
       l.days_without_contact
         - greatest(0, floor(extract(epoch from (now() - l.last_contact_at)) / 86400))::int
                                                           as diferencia,
       l.last_contact_at,
       (select max(a.created_at) from public.activities a where a.lead_id = l.id)
                                                           as ultima_actividad
  from public.leads l
 order by l.days_without_contact desc;

-- ============================================================
-- Migración 009 — leads.closed_at (fecha real de cierre)
-- Correr COMPLETO en el Supabase SQL Editor. Idempotente.
--
-- Base de todas las métricas de plata: "Cierres este mes" e
-- "Ingresos por mes" dejan de depender de updated_at (proxy impreciso)
-- y pasan a usar la fecha real en que el lead llegó a "Escritura".
--
-- Mecánica:
--   - closed_at se setea solo cuando el lead entra a la etapa Escritura.
--   - Si el lead sale de Escritura, se limpia (no está cerrado).
--   - Backfill: leads ya en Escritura sin closed_at → updated_at.
-- ============================================================

-- 1. Columna
alter table public.leads
  add column if not exists closed_at timestamptz;

-- 2. Backfill ANTES de crear el trigger (usa updated_at como aproximación)
update public.leads l
   set closed_at = l.updated_at
  from public.pipeline_stages s
 where l.stage_id = s.id
   and s.key = 'escritura'
   and l.closed_at is null;

-- 3. Trigger: mantiene closed_at consistente con la etapa
create or replace function public.set_lead_closed_at()
returns trigger
language plpgsql
as $$
declare
  v_is_escritura boolean;
begin
  select (key = 'escritura') into v_is_escritura
    from public.pipeline_stages where id = new.stage_id;

  if coalesce(v_is_escritura, false) then
    -- Entra (o sigue) en Escritura: fijar la fecha la primera vez
    if new.closed_at is null then
      new.closed_at := now();
    end if;
  else
    -- No está en Escritura: no está cerrado
    new.closed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists leads_set_closed_at on public.leads;
create trigger leads_set_closed_at
  before insert or update on public.leads
  for each row execute procedure public.set_lead_closed_at();

-- 4. VERIFICACIÓN — deberían coincidir conteo en escritura y con closed_at
select
  (select count(*) from public.leads l
     join public.pipeline_stages s on s.id = l.stage_id
    where s.key = 'escritura')                                  as en_escritura,
  (select count(*) from public.leads where closed_at is not null) as con_closed_at,
  (select count(*) from public.leads
    where closed_at >= date_trunc('month', now()))              as cerrados_este_mes;

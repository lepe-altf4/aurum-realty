-- ============================================================
-- Aurum Realty CRM — Propiedad de leads + RLS real + dólar auto
-- Correr COMPLETO en el Supabase SQL Editor.
-- Idempotente: se puede correr varias veces sin romper nada.
--
-- Qué hace:
--   1. leads.owner_id + leads.status_asignacion (+ backfill)
--   2. Tabla lead_claims (reclamos del pozo)
--   3. Helpers current_agent_id() / is_admin()
--   4. RPCs claim_lead() / resolve_claim() (flujo seguro de reclamo)
--   5. Policies RLS reales en leads y lead_claims
--   6. Columnas de cotización automática en organization
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. LEADS: owner_id + status_asignacion
--    owner_id referencia a agents(id) (la identidad de usuario
--    de la app; agents.auth_user_id la vincula con auth.users).
--    NULL = lead en el pozo común.
-- ──────────────────────────────────────────────────────────────
alter table public.leads
  add column if not exists owner_id uuid references public.agents(id) on delete set null;

alter table public.leads
  add column if not exists status_asignacion text not null default 'pool';

alter table public.leads
  drop constraint if exists leads_status_asignacion_check;
alter table public.leads
  add constraint leads_status_asignacion_check
  check (status_asignacion in ('pool','pendiente_aprobacion','asignado'));

create index if not exists leads_owner_id_idx on public.leads(owner_id);
create index if not exists leads_status_asignacion_idx on public.leads(status_asignacion);

-- Backfill: los leads que ya tenían agente pasan a ser de ese agente.
update public.leads
   set owner_id = agent_id,
       status_asignacion = 'asignado'
 where agent_id is not null
   and owner_id is null
   and status_asignacion = 'pool';

-- ──────────────────────────────────────────────────────────────
-- 2. LEAD_CLAIMS — reclamos sobre leads del pozo
-- ──────────────────────────────────────────────────────────────
create table if not exists public.lead_claims (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  agente_id   uuid not null references public.agents(id) on delete cascade,
  estado      text not null default 'pendiente'
                check (estado in ('pendiente','aprobado','rechazado')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.agents(id)
);

create index if not exists lead_claims_lead_id_idx   on public.lead_claims(lead_id);
create index if not exists lead_claims_agente_id_idx on public.lead_claims(agente_id);

-- Un agente no puede tener dos reclamos pendientes del mismo lead
create unique index if not exists lead_claims_unique_pending
  on public.lead_claims(lead_id, agente_id)
  where estado = 'pendiente';

-- ──────────────────────────────────────────────────────────────
-- 3. HELPERS (security definer para no recursar en RLS)
-- ──────────────────────────────────────────────────────────────
create or replace function public.current_agent_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.agents where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.agents
    where auth_user_id = auth.uid() and role = 'Admin'
  );
$$;

-- ──────────────────────────────────────────────────────────────
-- 4. RPCs — flujo de reclamo atómico y seguro
--    (security definer: el cambio pool → pendiente_aprobacion
--    NO requiere policy de UPDATE sobre leads ajenos)
-- ──────────────────────────────────────────────────────────────
create or replace function public.claim_lead(p_lead_id uuid)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_agent_id uuid;
  v_status   text;
  v_claim_id uuid;
begin
  v_agent_id := public.current_agent_id();
  if v_agent_id is null then
    raise exception 'No existe un agente para este usuario';
  end if;

  select status_asignacion into v_status
    from public.leads where id = p_lead_id for update;
  if v_status is null then
    raise exception 'Lead inexistente';
  end if;
  if v_status = 'asignado' then
    raise exception 'El lead ya fue asignado';
  end if;

  -- Evitar duplicado del mismo agente
  if exists (select 1 from public.lead_claims
              where lead_id = p_lead_id and agente_id = v_agent_id
                and estado = 'pendiente') then
    raise exception 'Ya reclamaste este lead. Esperá la aprobación.';
  end if;

  insert into public.lead_claims (lead_id, agente_id)
  values (p_lead_id, v_agent_id)
  returning id into v_claim_id;

  update public.leads
     set status_asignacion = 'pendiente_aprobacion'
   where id = p_lead_id;

  return json_build_object('claim_id', v_claim_id, 'estado', 'pendiente');
end;
$$;

create or replace function public.resolve_claim(p_claim_id uuid, p_approve boolean)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_claim   public.lead_claims;
  v_admin   uuid;
  v_pending integer;
begin
  if not public.is_admin() then
    raise exception 'Solo un Admin puede resolver reclamos';
  end if;
  v_admin := public.current_agent_id();

  select * into v_claim from public.lead_claims where id = p_claim_id for update;
  if v_claim.id is null then
    raise exception 'Reclamo inexistente';
  end if;
  if v_claim.estado <> 'pendiente' then
    raise exception 'El reclamo ya fue resuelto';
  end if;

  if p_approve then
    update public.lead_claims
       set estado = 'aprobado', resolved_at = now(), resolved_by = v_admin
     where id = p_claim_id;

    -- Rechazar el resto de reclamos pendientes de ese lead
    update public.lead_claims
       set estado = 'rechazado', resolved_at = now(), resolved_by = v_admin
     where lead_id = v_claim.lead_id and estado = 'pendiente' and id <> p_claim_id;

    update public.leads
       set owner_id = v_claim.agente_id,
           agent_id = v_claim.agente_id,   -- mantiene consistencia con vistas existentes
           status_asignacion = 'asignado'
     where id = v_claim.lead_id;

    return json_build_object('estado', 'aprobado', 'lead_id', v_claim.lead_id);
  else
    update public.lead_claims
       set estado = 'rechazado', resolved_at = now(), resolved_by = v_admin
     where id = p_claim_id;

    -- Si no quedan reclamos pendientes, el lead vuelve al pozo
    select count(*) into v_pending
      from public.lead_claims
     where lead_id = v_claim.lead_id and estado = 'pendiente';
    if v_pending = 0 then
      update public.leads
         set status_asignacion = 'pool'
       where id = v_claim.lead_id and status_asignacion = 'pendiente_aprobacion';
    end if;

    return json_build_object('estado', 'rechazado', 'lead_id', v_claim.lead_id);
  end if;
end;
$$;

grant execute on function public.claim_lead(uuid)            to authenticated;
grant execute on function public.resolve_claim(uuid, boolean) to authenticated;
grant execute on function public.current_agent_id()           to authenticated;
grant execute on function public.is_admin()                   to authenticated;

-- ──────────────────────────────────────────────────────────────
-- 5. RLS REAL en leads y lead_claims
--    Reemplaza las policies permisivas "Auth * leads".
-- ──────────────────────────────────────────────────────────────
alter table public.leads       enable row level security;
alter table public.lead_claims enable row level security;

drop policy if exists "Auth read leads"   on public.leads;
drop policy if exists "Auth insert leads" on public.leads;
drop policy if exists "Auth update leads" on public.leads;
drop policy if exists "Auth delete leads" on public.leads;
drop policy if exists "Leads select own or pool" on public.leads;
drop policy if exists "Leads insert own or pool" on public.leads;
drop policy if exists "Leads update owner or admin" on public.leads;
drop policy if exists "Leads delete admin" on public.leads;

-- SELECT: Admin todo. Agente/Senior/Junior: sus leads + los del pozo
-- (incluye 'pendiente_aprobacion' para que el pozo muestre el estado
-- "reclamado, esperando aprobación" en lugar de desaparecer el lead).
create policy "Leads select own or pool" on public.leads
  for select using (
    public.is_admin()
    or owner_id = public.current_agent_id()
    or status_asignacion in ('pool','pendiente_aprobacion')
  );

-- INSERT: cualquier usuario autenticado puede cargar un lead,
-- pero un no-admin solo puede asignárselo a sí mismo o dejarlo en el pozo.
create policy "Leads insert own or pool" on public.leads
  for insert with check (
    public.is_admin()
    or owner_id is null
    or owner_id = public.current_agent_id()
  );

-- UPDATE: solo el dueño o el Admin. El reclamo del pozo NO pasa por acá
-- (usa claim_lead(), que es security definer).
create policy "Leads update owner or admin" on public.leads
  for update using (
    public.is_admin()
    or owner_id = public.current_agent_id()
  )
  with check (
    public.is_admin()
    or owner_id = public.current_agent_id()
  );

-- DELETE: solo Admin
create policy "Leads delete admin" on public.leads
  for delete using (public.is_admin());

-- lead_claims: Admin ve todo; el agente ve sus propios reclamos.
-- Escrituras solo vía RPCs (security definer) o Admin.
drop policy if exists "Claims select own or admin" on public.lead_claims;
drop policy if exists "Claims admin write"         on public.lead_claims;

create policy "Claims select own or admin" on public.lead_claims
  for select using (
    public.is_admin()
    or agente_id = public.current_agent_id()
  );

create policy "Claims admin write" on public.lead_claims
  for all using (public.is_admin()) with check (public.is_admin());

-- Realtime para que el pozo/reclamos se refresquen
do $$
begin
  begin alter publication supabase_realtime add table lead_claims; exception when duplicate_object then null; end;
end;
$$;

-- ──────────────────────────────────────────────────────────────
-- 6. ORGANIZATION — cotización automática del dólar
--    dollar_rate sigue siendo el valor efectivo que lee la app.
--    source: 'auto' (lo pisa dolarapi) | 'manual' (override del Admin)
-- ──────────────────────────────────────────────────────────────
alter table public.organization
  add column if not exists dollar_rate_updated_at timestamptz default now();

alter table public.organization
  add column if not exists dollar_rate_source text not null default 'auto';

alter table public.organization
  drop constraint if exists organization_dollar_rate_source_check;
alter table public.organization
  add constraint organization_dollar_rate_source_check
  check (dollar_rate_source in ('auto','manual'));

-- ──────────────────────────────────────────────────────────────
-- 7. VERIFICACIÓN — deberías ver los conteos y columnas nuevas
-- ──────────────────────────────────────────────────────────────
select
  (select count(*) from public.leads)                                   as leads,
  (select count(*) from public.leads where status_asignacion = 'pool')  as leads_en_pozo,
  (select count(*) from public.leads where owner_id is not null)        as leads_con_dueno,
  (select count(*) from public.lead_claims)                             as claims;

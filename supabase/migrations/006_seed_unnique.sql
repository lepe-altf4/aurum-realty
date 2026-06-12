-- ============================================================
-- Migración 006 — Datos de demo: UNNIQUE Negocios Inmobiliarios
-- (reemplaza por completo la demo de propiedades/leads anterior)
-- Correr COMPLETO en el Supabase SQL Editor. Re-ejecutable.
--
-- ⚠️ Requiere haber corrido ANTES (en este orden):
--    policies_leads.sql · 004_days_sin_contacto.sql · 005_equipo_admin_only.sql
--
-- Qué hace:
--   1. Organización → Unnique (Neuquén Capital)
--   2. Borra propiedades/leads de demo y agentes demo @aurum.com.ar
--   3. Carga equipo, 20 propiedades reales de Unnique y 11 leads
--      (incluye 2 en el pozo + 1 reclamo pendiente para la demo)
--   4. Actividades con fechas reales → days_without_contact honesto
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 0. Pre-checks: que las migraciones previas existan
-- ──────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='leads' and column_name='owner_id') then
    raise exception 'Falta correr supabase/policies_leads.sql antes de este script';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='leads' and column_name='last_contact_at') then
    raise exception 'Falta correr supabase/migrations/004_days_sin_contacto.sql antes de este script';
  end if;
end $$;

-- ──────────────────────────────────────────────────────────────
-- 1. ORGANIZACIÓN → Unnique
-- ──────────────────────────────────────────────────────────────
insert into public.organization (name, cuit, address, dollar_rate)
select 'Unnique Negocios Inmobiliarios', null, 'Diagonal 9 de Julio 43, Piso 4 Of. B, Neuquén Capital', 1300
where not exists (select 1 from public.organization);

update public.organization
   set name    = 'Unnique Negocios Inmobiliarios',
       cuit    = null,                                                       -- se carga desde Settings cuando lo tengan
       address = 'Diagonal 9 de Julio 43, Piso 4 Of. B, Neuquén Capital';

-- ──────────────────────────────────────────────────────────────
-- 2. Limpieza de la demo de propiedades/leads anterior
--    (leads cascada a activities y lead_claims)
-- ──────────────────────────────────────────────────────────────
delete from public.leads;
delete from public.properties;
-- Solo agentes de demo (sin login real). El Admin auth-linked queda intacto.
delete from public.agents
 where auth_user_id is null
   and (email like '%@aurum.com.ar' or email like '%@unnique.com.ar');

-- ──────────────────────────────────────────────────────────────
-- 3. EQUIPO Unnique (demo, sin login; se invitan luego desde Settings)
-- ──────────────────────────────────────────────────────────────
insert into public.agents (name, email, role, commission_pct, status, initials) values
  ('Richard Domínguez', 'richard@unnique.com.ar', 'Senior', 3.5, 'Activo', 'RD'),
  ('Lucía Sandoval',    'lucia@unnique.com.ar',   'Senior', 3.5, 'Activo', 'LS'),
  ('Matías Curihual',   'matias@unnique.com.ar',  'Agente', 3.0, 'Activo', 'MC'),
  ('Brenda Aguirre',    'brenda@unnique.com.ar',  'Agente', 3.0, 'Activo', 'BA'),
  ('Tomás Vera',        'tomas@unnique.com.ar',   'Junior', 2.5, 'Activo', 'TV')
on conflict (email) do update
  set name = excluded.name, role = excluded.role,
      commission_pct = excluded.commission_pct,
      status = excluded.status, initials = excluded.initials;

-- ──────────────────────────────────────────────────────────────
-- 4. PROPIEDADES (20) — listados reales de Unnique (Neuquén / Alto Valle)
--    Tipos mapeados al check de la tabla: Terreno/Chacra/Lote→Lote,
--    Oficina/Galpón→Local. price_ars ≈ price_usd × 1300.
-- ──────────────────────────────────────────────────────────────
insert into public.properties
  (address, neighborhood, type, operation, price_usd, price_ars, currency_listing, sqm, rooms, status, premium, description)
values
  -- VENTA (USD)
  ('Lotes Ruta 67',                       'Confluencia',        'Lote',         'Venta',  900000,  1170000000, 'USD', 20000, 0, 'Disponible', true,  'Macrolote de 20.000 m² sobre Ruta 67. Ideal desarrollo o inversión.'),
  ('Diagonal España 400, 7° A',           'Área Centro Este',   'Departamento', 'Venta',  240000,   312000000, 'USD',   114, 5, 'Disponible', true,  '5 ambientes, 114 m². Excelente vista, categoría premium en pleno centro.'),
  ('Leloir 900, 2° B',                    'Área Centro Oeste',  'Departamento', 'Venta',  190000,   247000000, 'USD',    89, 3, 'Disponible', false, '3 ambientes, 89 m². Luminoso, con cochera.'),
  ('Lote Primaterra',                     'Confluencia',        'Lote',         'Venta',   38000,    49400000, 'USD',   477, 0, 'Disponible', false, 'Terreno 477 m² en barrio Primaterra. Todos los servicios.'),
  ('Islas Malvinas 600',                  'Capital',            'Casa',         'Venta',  145000,   188500000, 'USD',    82, 3, 'Disponible', false, 'Casa 3 dormitorios, 82 m² cubiertos. Patio y cochera.'),
  ('Chile 400',                           'Confluencia',        'Casa',         'Venta',   98000,   127400000, 'USD',    65, 2, 'Disponible', false, 'Casa 2 dormitorios. Ideal primera vivienda.'),
  ('Departamento Centro, San Martín 200', 'Centro',             'Departamento', 'Venta',  170000,   221000000, 'USD',    61, 3, 'Vendida',    false, '3 ambientes, 61 m². A metros de la peatonal.'),
  ('Loteo La Consuelo, Centenario',       'Centenario',         'Lote',         'Venta',   75500,    98150000, 'USD',   807, 0, 'Disponible', false, 'Terreno 807 m² en Centenario. Zona en crecimiento.'),
  ('Casa Milenium, Cipolletti',           'Cipolletti',         'Casa',         'Venta',  320000,   416000000, 'USD',   280, 5, 'Reservada',  true,  'Casa premium 5 dormitorios, 280 m². Barrio cerrado.'),
  ('Terreno Plottier',                    'Plottier',           'Lote',         'Venta',   27000,    35100000, 'USD',   360, 0, 'Disponible', false, 'Terreno 360 m² en Plottier. Oportunidad.'),
  ('Chacra Ruta 151, Cipolletti',         'Cipolletti',         'Lote',         'Venta',  700000,   910000000, 'USD', 52000, 0, 'Disponible', true,  'Chacra 5,2 hectáreas sobre Ruta 151. Producción y desarrollo.'),
  ('Casa Barrio Los Tilos, Cipolletti',   'Cipolletti',         'Casa',         'Venta',  250000,   325000000, 'USD',   236, 4, 'Disponible', true,  'Casa 4 dormitorios, 236 m². Barrio Los Tilos, impecable.'),
  ('Cipolletti Manzanar 7',               'Cipolletti',         'Casa',         'Venta',  240000,   312000000, 'USD',   144, 3, 'Disponible', false, 'Casa 3 dormitorios, 144 m². Barrio Manzanar.'),
  ('Santa Fe 600, 4°',                    'Capital',            'Departamento', 'Venta',  100000,   130000000, 'USD',    50, 2, 'Disponible', false, '2 ambientes, 50 m². Renta asegurada.'),
  ('Oficina Diagonal 9 de Julio 43',      'Centro',             'Local',        'Venta',  230000,   299000000, 'USD',   191, 0, 'Disponible', true,  'Oficina profesional 191 m² en pleno microcentro neuquino.'),
  -- ALQUILER (ARS, salvo Paseo de la Costa en USD)
  ('Av. Argentina y Paraguay, 5° C',      'Área Centro Este',   'Departamento', 'Alquiler', 1385,   1800000, 'ARS',  70, 3, 'Disponible', false, '3 ambientes, 70 m². Pleno centro, luminoso.'),
  ('Independencia 600',                    'Confluencia',        'Casa',         'Alquiler', 1846,   2400000, 'ARS',  55, 1, 'Disponible', false, 'Casa 1 dormitorio con patio. Zona tranquila.'),
  ('Paseo de la Costa (Dúplex)',          'Río Grande',         'Departamento', 'Alquiler', 2500,   3250000, 'USD', 140, 6, 'Disponible', true,  'Dúplex 3 dormitorios, 6 ambientes. Paseo de la Costa, categoría.'),
  ('Monoambiente Diagonal 25 de Mayo 200','Centro',             'Departamento', 'Alquiler',  846,   1100000, 'ARS',  35, 1, 'Disponible', false, 'Monoambiente amoblado, 35 m². Ideal profesional.'),
  ('Galpón Calfucura 300',                'Capital',            'Local',        'Alquiler', 2077,   2700000, 'ARS', 180, 0, 'Disponible', false, 'Galpón 180 m². Acceso para camiones, ideal logística.');

-- ──────────────────────────────────────────────────────────────
-- 5. LEADS + ACTIVIDADES + RECLAMO (vía DO block para resolver IDs)
-- ──────────────────────────────────────────────────────────────
do $$
declare
  -- stages
  s_consulta uuid; s_visita uuid; s_oferta uuid; s_reserva uuid; s_escritura uuid;
  -- agentes
  a_richard uuid; a_lucia uuid; a_matias uuid;
  -- propiedades
  p_espana uuid; p_primaterra uuid; p_malvinas uuid; p_leloir uuid;
  p_tilos uuid; p_santafe uuid; p_milenium uuid; p_centro uuid;
  p_plottier uuid; p_argentina uuid; p_mono uuid;
  -- leads
  l1 uuid; l2 uuid; l3 uuid; l4 uuid; l5 uuid; l6 uuid; l7 uuid; l8 uuid; l11 uuid;
begin
  select id into s_consulta  from public.pipeline_stages where key='consulta';
  select id into s_visita    from public.pipeline_stages where key='visita';
  select id into s_oferta    from public.pipeline_stages where key='oferta';
  select id into s_reserva   from public.pipeline_stages where key='reserva';
  select id into s_escritura from public.pipeline_stages where key='escritura';

  select id into a_richard from public.agents where email='richard@unnique.com.ar';
  select id into a_lucia   from public.agents where email='lucia@unnique.com.ar';
  select id into a_matias  from public.agents where email='matias@unnique.com.ar';

  select id into p_espana     from public.properties where address='Diagonal España 400, 7° A';
  select id into p_primaterra from public.properties where address='Lote Primaterra';
  select id into p_malvinas   from public.properties where address='Islas Malvinas 600';
  select id into p_leloir     from public.properties where address='Leloir 900, 2° B';
  select id into p_tilos      from public.properties where address='Casa Barrio Los Tilos, Cipolletti';
  select id into p_santafe    from public.properties where address='Santa Fe 600, 4°';
  select id into p_milenium   from public.properties where address='Casa Milenium, Cipolletti';
  select id into p_centro     from public.properties where address='Departamento Centro, San Martín 200';
  select id into p_plottier   from public.properties where address='Terreno Plottier';
  select id into p_argentina  from public.properties where address='Av. Argentina y Paraguay, 5° C';
  select id into p_mono       from public.properties where address='Monoambiente Diagonal 25 de Mayo 200';

  -- ── Leads ASIGNADOS (owner = agente) ─────────────────────────────
  insert into public.leads (name, phone, email, origin, property_id, operation, stage_id, agent_id, owner_id, status_asignacion, amount, currency, hot, score, days_without_contact, last_contact_at, next_action_date, notes, created_at)
  values ('Gabriel Sepúlveda','+54 9 299 401-2210','g.sepulveda@gmail.com','Web',       p_espana,    'Venta',   s_consulta,  a_richard, a_richard,'asignado', 240000,'USD',false,55, 4, now()-interval '12 days', current_date+2, 'Consulta por el depto de Diagonal España. Pide ver opciones de financiación.', now()-interval '12 days')
  returning id into l1;

  insert into public.leads (name, phone, email, origin, property_id, operation, stage_id, agent_id, owner_id, status_asignacion, amount, currency, hot, score, days_without_contact, last_contact_at, next_action_date, notes, created_at)
  values ('Daniela Quintriqueo','+54 9 299 512-8834','dani.q@hotmail.com','Instagram',   p_primaterra,'Venta',   s_consulta,  a_matias,  a_matias, 'asignado',  38000,'USD',false,40, 6, now()-interval '9 days',  current_date+1, 'Quiere construir. Consulta servicios y medidas del lote Primaterra.', now()-interval '9 days')
  returning id into l2;

  insert into public.leads (name, phone, email, origin, property_id, operation, stage_id, agent_id, owner_id, status_asignacion, amount, currency, hot, score, days_without_contact, last_contact_at, next_action_date, notes, created_at)
  values ('Yamila Ferrari','+54 9 299 315-6677','yami.ferrari@gmail.com','WhatsApp',     p_malvinas,  'Venta',   s_visita,    a_lucia,   a_lucia,  'asignado', 145000,'USD',true, 82, 1, now()-interval '8 days',  current_date+1, 'HOT — busca casa familiar. Visita realizada, muy interesada.', now()-interval '8 days')
  returning id into l3;

  insert into public.leads (name, phone, email, origin, property_id, operation, stage_id, agent_id, owner_id, status_asignacion, amount, currency, hot, score, days_without_contact, last_contact_at, next_action_date, notes, created_at)
  values ('Hernán Lagos','+54 9 299 234-9001','hernan.lagos@gmail.com','Referido',       p_leloir,    'Venta',   s_visita,    a_richard, a_richard,'asignado', 190000,'USD',false,66, 3, now()-interval '7 days',  current_date+3, 'Referido. Visitó el depto de Leloir, pide segunda visita con la esposa.', now()-interval '7 days')
  returning id into l4;

  insert into public.leads (name, phone, email, origin, property_id, operation, stage_id, agent_id, owner_id, status_asignacion, amount, currency, hot, score, days_without_contact, last_contact_at, next_action_date, notes, created_at)
  values ('Florencia Maldonado','+54 9 299 417-3322','flor.maldonado@outlook.com','Web',  p_tilos,     'Venta',   s_oferta,    a_lucia,   a_lucia,  'asignado', 245000,'USD',true, 89, 0, now(),                     current_date+1, 'Ofertó USD 245.000 por Los Tilos. Propietario evalúa. Cierre inminente.', now()-interval '6 days')
  returning id into l5;

  insert into public.leads (name, phone, email, origin, property_id, operation, stage_id, agent_id, owner_id, status_asignacion, amount, currency, hot, score, days_without_contact, last_contact_at, next_action_date, notes, created_at)
  values ('Pablo Tilleria','+54 9 299 523-1188','pablo.tilleria@gmail.com','ZonaProp',    p_santafe,   'Venta',   s_oferta,    a_matias,  a_matias, 'asignado', 100000,'USD',false,71, 2, now()-interval '5 days',  current_date+1, 'Inversor. Ofertó USD 100.000 por el depto de Santa Fe para renta.', now()-interval '5 days')
  returning id into l6;

  insert into public.leads (name, phone, email, origin, property_id, operation, stage_id, agent_id, owner_id, status_asignacion, amount, currency, hot, score, days_without_contact, last_contact_at, next_action_date, notes, created_at)
  values ('Carolina Painé','+54 9 299 416-4455','caro.paine@gmail.com','Referido',        p_milenium,  'Venta',   s_reserva,   a_richard, a_richard,'asignado', 320000,'USD',true, 94, 0, now(),                     current_date+7, 'Reserva firmada por Casa Milenium. Seña 10% abonada. Escritura en 30 días.', now()-interval '14 days')
  returning id into l7;

  insert into public.leads (name, phone, email, origin, property_id, operation, stage_id, agent_id, owner_id, status_asignacion, amount, currency, hot, score, days_without_contact, last_contact_at, next_action_date, notes, created_at)
  values ('Marcos Heredia','+54 9 299 621-7788','marcos.heredia@gmail.com','WhatsApp',    p_centro,    'Venta',   s_escritura, a_lucia,   a_lucia,  'asignado', 170000,'USD',false,96, 1, now()-interval '20 days', current_date+2, 'Escritura del Departamento Centro programada. Documentación completa.', now()-interval '20 days')
  returning id into l8;

  -- ── Leads en el POZO (sin dueño) ─────────────────────────────────
  insert into public.leads (name, phone, email, origin, property_id, operation, stage_id, agent_id, owner_id, status_asignacion, amount, currency, hot, score, days_without_contact, last_contact_at, next_action_date, notes, created_at)
  values ('Nicolás Bravo','+54 9 299 408-9090','nico.bravo@gmail.com','Web',              p_plottier,  'Venta',   s_consulta,  null, null, 'pool', 27000,'USD',false,45, 3, now()-interval '3 days', null, 'Consulta web por el terreno de Plottier. Sin asignar.', now()-interval '3 days');

  insert into public.leads (name, phone, email, origin, property_id, operation, stage_id, agent_id, owner_id, status_asignacion, amount, currency, hot, score, days_without_contact, last_contact_at, next_action_date, notes, created_at)
  values ('Sofía Antimán','+54 9 299 512-3434','sofi.antiman@gmail.com','Instagram',      p_argentina, 'Alquiler',s_consulta,  null, null, 'pool', 1800000,'ARS',false,38, 1, now()-interval '1 day', null, 'Consulta por alquiler en Av. Argentina. Sin asignar.', now()-interval '1 day');

  -- ── Lead RECLAMADO (pendiente de aprobación del Admin) ───────────
  insert into public.leads (name, phone, email, origin, property_id, operation, stage_id, agent_id, owner_id, status_asignacion, amount, currency, hot, score, days_without_contact, last_contact_at, next_action_date, notes, created_at)
  values ('Emiliano Cárdenas','+54 9 299 234-5656','emi.cardenas@gmail.com','WhatsApp',   p_mono,      'Alquiler',s_consulta,  null, null, 'pendiente_aprobacion', 1100000,'ARS',false,50, 5, now()-interval '5 days', null, 'Consulta por el monoambiente. Reclamado por Matías, espera aprobación.', now()-interval '5 days')
  returning id into l11;

  insert into public.lead_claims (lead_id, agente_id, estado)
  values (l11, a_matias, 'pendiente');

  -- ── ACTIVIDADES (definen el "último contacto" real de cada lead) ──
  insert into public.activities (lead_id, agent_id, type, description, created_at) values
    (l1, a_richard, 'Web',         'Ingresó consulta web por Diagonal España 400.',                now()-interval '12 days'),
    (l1, a_richard, 'WhatsApp',    'Se envió ficha y opciones de financiación.',                   now()-interval '4 days'),

    (l2, a_matias,  'Instagram',   'Consulta por DM sobre el lote Primaterra.',                    now()-interval '9 days'),
    (l2, a_matias,  'Llamada',     'Se explicaron medidas y servicios. Quedó en pensarlo.',        now()-interval '6 days'),

    (l3, a_lucia,   'WhatsApp',    'Primer contacto por Islas Malvinas 600.',                      now()-interval '8 days'),
    (l3, a_lucia,   'Visita',      'Visita realizada. Muy interesada, consulta por reserva.',      now()-interval '1 day'),

    (l4, a_richard, 'Llamada',     'Referido de Carolina Painé. Coordinó visita a Leloir.',        now()-interval '7 days'),
    (l4, a_richard, 'Visita',      'Visitó el depto. Pide segunda visita con la esposa.',          now()-interval '3 days'),

    (l5, a_lucia,   'Visita',      'Visitó Los Tilos. Decidida a ofertar.',                        now()-interval '4 days'),
    (l5, a_lucia,   'Nota',        'Presentó oferta de USD 245.000. Propietario evalúa.',          now()),

    (l6, a_matias,  'ZonaProp',    'Consulta por Santa Fe 600 para inversión.',                    now()-interval '5 days'),
    (l6, a_matias,  'Email',       'Envió oferta formal por USD 100.000.',                         now()-interval '2 days'),

    (l7, a_richard, 'WhatsApp',    'Coordinó reserva de Casa Milenium.',                           now()-interval '5 days'),
    (l7, a_richard, 'Cambio_etapa','Reserva firmada y seña abonada.',                              now()),

    (l8, a_lucia,   'Visita',      'Cliente cerró compra del Departamento Centro.',                now()-interval '10 days'),
    (l8, a_lucia,   'Cambio_etapa','Documentación completa, en escribanía.',                       now()-interval '1 day');
end $$;

-- ──────────────────────────────────────────────────────────────
-- 6. Recalcular days_without_contact desde last_contact_at
--    (el trigger de actividades dejó algunos en 0; esto los ajusta)
-- ──────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_proc where proname='refresh_days_without_contact') then
    perform public.refresh_days_without_contact();
  end if;
end $$;

-- ──────────────────────────────────────────────────────────────
-- 7. VERIFICACIÓN
-- ──────────────────────────────────────────────────────────────
select
  (select name from public.organization limit 1)                                  as organizacion,
  (select count(*) from public.properties)                                        as propiedades,
  (select count(*) from public.agents where email like '%@unnique.com.ar')        as agentes_unnique,
  (select count(*) from public.leads)                                             as leads_total,
  (select count(*) from public.leads where status_asignacion='pool')              as leads_en_pozo,
  (select count(*) from public.leads where status_asignacion='pendiente_aprobacion') as leads_reclamados,
  (select count(*) from public.lead_claims where estado='pendiente')              as reclamos_pendientes,
  (select count(*) from public.activities)                                        as actividades;

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ⚠️ ENDPOINT TEMPORAL DE DIAGNÓSTICO — solo lectura, protegido por token.
// Se elimina apenas termina la auditoría (las env vars de Vercel son
// "sensitive" y no se pueden leer desde afuera; esto corre donde sí existen).
const DIAG_TOKEN = 'diag-7f3a9c1e4b8d2065a1f0c9e7d3b5a482'

export async function GET(req: Request) {
  if (req.headers.get('x-diag-token') !== DIAG_TOKEN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const out: Record<string, unknown> = {}
  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    return NextResponse.json({ fatal: (e as Error).message }, { status: 500 })
  }

  // ── Leads: lo mismo que computan las páginas ──
  const leads = await admin.from('leads').select('id, name, owner_id, agent_id, status_asignacion, days_without_contact, last_contact_at')
  if (leads.error) {
    out.leads_error = leads.error.message
  } else {
    const rows = leads.data ?? []
    out.leads_total = rows.length
    out.leads_por_status = rows.reduce((acc: Record<string, number>, l) => {
      const k = l.status_asignacion ?? 'null'; acc[k] = (acc[k] ?? 0) + 1; return acc
    }, {})
    out.mis_leads_admin = rows.filter(l => (l.owner_id ?? l.agent_id) && (!l.status_asignacion || l.status_asignacion === 'asignado')).length
    out.pozo = rows.filter(l => l.status_asignacion === 'pool' || l.status_asignacion === 'pendiente_aprobacion').length
  }

  // ── Claims / agentes / org / propiedades ──
  const claims = await admin.from('lead_claims').select('id, estado, agente_id')
  out.claims = claims.error ? claims.error.message : claims.data
  const agents = await admin.from('agents').select('id, name, email, role, status, auth_user_id')
  out.agents = agents.error ? agents.error.message : agents.data?.map(a => ({ ...a, auth_user_id: a.auth_user_id ? 'linked' : null }))
  const org = await admin.from('organization').select('name, dollar_rate, dollar_rate_source, dollar_rate_updated_at')
  out.organization = org.error ? org.error.message : org.data
  const props = await admin.from('properties').select('id, photo_url', { count: 'exact', head: false }).limit(3)
  out.properties_count = props.error ? props.error.message : (props.count ?? 'n/a')

  // ── Migración 007 aplicada? ──
  const photos = await admin.from('property_photos').select('id', { count: 'exact', head: true })
  out.property_photos = photos.error ? `ERROR: ${photos.error.message}` : `ok (${photos.count} fotos)`

  // ── Storage: buckets ──
  try {
    const { data: buckets, error } = await admin.storage.listBuckets()
    out.buckets = error ? error.message : buckets?.map(b => ({ id: b.id, public: b.public }))
  } catch (e) {
    out.buckets = (e as Error).message
  }

  // ── Auth: usuarios (emails + confirmación) ──
  try {
    const { data: page, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 50 })
    out.auth_users = error ? error.message : page.users.map(u => ({
      email: u.email,
      confirmed: !!u.email_confirmed_at,
      last_sign_in: u.last_sign_in_at ?? null,
    }))
  } catch (e) {
    out.auth_users = (e as Error).message
  }

  return NextResponse.json(out)
}

import { createClient } from '@/lib/supabase/server'
import PoolView from '@/components/leads/pool-view'
import type { Lead, LeadClaim } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PoolPage() {
  // Lecturas con la sesión del usuario: RLS decide qué filas ve.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: viewer } = await supabase
    .from('agents')
    .select('*')
    .eq('auth_user_id', user?.id ?? '')
    .maybeSingle()

  const isAdmin = viewer?.role === 'Admin'

  const leadsRes = await supabase
    .from('leads')
    .select('*, property:properties(*), stage:pipeline_stages(*), agent:agents(*)')
    .in('status_asignacion', ['pool', 'pendiente_aprobacion'])
    .order('created_at', { ascending: false })

  // Si la migración todavía no corrió, la columna no existe → aviso claro.
  if (leadsRes.error && /status_asignacion|owner_id|does not exist|schema cache/i.test(leadsRes.error.message)) {
    return (
      <div style={{ padding: 48, maxWidth: 620 }}>
        <h2 style={{ fontFamily: 'var(--font-jakarta)', fontSize: 20, marginBottom: 10 }}>Falta un paso en la base de datos</h2>
        <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.6 }}>
          Para activar el Pozo de Leads hay que correr el script{' '}
          <code style={{ background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4 }}>supabase/policies_leads.sql</code>{' '}
          en el SQL Editor de Supabase. Crea las columnas de propiedad de leads, la tabla de reclamos y las políticas de seguridad.
        </p>
        <p style={{ color: 'var(--ink-3)', fontSize: 12, marginTop: 12, fontFamily: 'var(--font-mono)' }}>{leadsRes.error.message}</p>
      </div>
    )
  }

  // Reclamos: el Admin ve todos los pendientes; el agente, los suyos.
  const claimsRes = await supabase
    .from('lead_claims')
    .select('*, lead:leads(*), agente:agents(*)')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true })

  return (
    <PoolView
      initialLeads={(leadsRes.data ?? []) as Lead[]}
      initialClaims={(claimsRes.data ?? []) as LeadClaim[]}
      viewer={viewer}
      isAdmin={isAdmin}
    />
  )
}

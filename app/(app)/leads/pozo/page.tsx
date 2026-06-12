import { createAdminClient } from '@/lib/supabase/admin'
import { getViewer } from '@/lib/viewer'
import PoolView from '@/components/leads/pool-view'
import type { Lead, LeadClaim } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PoolPage() {
  const { agent: viewer, isAdmin } = await getViewer()

  let supabase
  try {
    supabase = createAdminClient()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <div className="p-8 text-red-600">
        <h2 className="text-xl font-bold mb-2">Configuration Error</h2>
        <p className="font-mono text-sm">{msg}</p>
      </div>
    )
  }

  const leadsRes = await supabase
    .from('leads')
    .select('*, property:properties(*), stage:pipeline_stages(*), agent:agents(*)')
    .in('status_asignacion', ['pool', 'pendiente_aprobacion'])
    .order('created_at', { ascending: false })

  // Si la migración de propiedad de leads no corrió, la columna no existe.
  if (leadsRes.error && /status_asignacion|owner_id|does not exist|schema cache/i.test(leadsRes.error.message)) {
    return (
      <div style={{ padding: 48, maxWidth: 620 }}>
        <h2 style={{ fontFamily: 'var(--font-jakarta)', fontSize: 20, marginBottom: 10 }}>Falta un paso en la base de datos</h2>
        <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.6 }}>
          Para activar el Pozo de Leads hay que correr el script{' '}
          <code style={{ background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4 }}>supabase/policies_leads.sql</code>{' '}
          en el SQL Editor de Supabase.
        </p>
        <p style={{ color: 'var(--ink-3)', fontSize: 12, marginTop: 12, fontFamily: 'var(--font-mono)' }}>{leadsRes.error.message}</p>
      </div>
    )
  }

  // Reclamos pendientes: el Admin ve todos; cada agente, los suyos. (filtro server-side)
  const claimsRes = await supabase
    .from('lead_claims')
    .select('*, lead:leads(*), agente:agents(*)')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true })

  const allClaims = (claimsRes.data ?? []) as LeadClaim[]
  const claims = isAdmin ? allClaims : allClaims.filter(c => c.agente_id === viewer?.id)

  return (
    <PoolView
      initialLeads={(leadsRes.data ?? []) as Lead[]}
      initialClaims={claims}
      viewer={viewer}
      isAdmin={isAdmin}
    />
  )
}

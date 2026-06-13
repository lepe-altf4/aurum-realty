import { createAdminClient } from '@/lib/supabase/admin'
import { ensureFreshDollarRate } from '@/lib/dollar'
import { getViewer, leadOwnerId } from '@/lib/viewer'
import ExecutiveDashboard from '@/components/dashboard/executive-dashboard'
import type { Organization, Lead } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
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

  const [leadsRes, agentsRes, orgRes, propsRes, stagesRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*, stage:pipeline_stages(id,name,position,key), property:properties(id,address,price_usd,price_ars,currency_listing)'),
    supabase.from('agents').select('*').order('name'),
    supabase.from('organization').select('*').limit(1).single(),
    supabase.from('properties').select('id,status').eq('status', 'Disponible'),
    supabase.from('pipeline_stages').select('*').order('position'),
  ])

  if (leadsRes.error) {
    console.error('[DashboardPage] leads query error:', leadsRes.error)
  }

  // El Admin ve los números de todo el equipo; cada agente, los suyos.
  const all = (leadsRes.data ?? []) as Lead[]
  const visible = isAdmin ? all : all.filter(l => leadOwnerId(l) === viewer?.id)

  // Cotización automática: si el último update tiene +6hs, refresca de dolarapi.
  const org = await ensureFreshDollarRate(orgRes.data as Organization | null)

  return (
    <ExecutiveDashboard
      leads={visible}
      agents={agentsRes.data ?? []}
      stages={stagesRes.data ?? []}
      dollarRate={org?.dollar_rate ?? 1200}
      dollarUpdatedAt={org?.dollar_rate_updated_at ?? null}
      dollarSource={org?.dollar_rate_source ?? 'manual'}
      activeProperties={propsRes.data?.length ?? 0}
    />
  )
}

import { createAdminClient } from '@/lib/supabase/admin'
import { getViewer, leadOwnerId } from '@/lib/viewer'
import SalesPanel from '@/components/sales/sales-panel'
import type { Lead } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function SalesPage() {
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

  const [leadsRes, stagesRes, agentsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*, stage:pipeline_stages(id,name,position,key), property:properties(id,address,price_usd,price_ars,currency_listing), agent:agents!agent_id(id,name,initials)')
      .order('created_at', { ascending: false }),
    supabase.from('pipeline_stages').select('*').order('position', { ascending: true }),
    supabase.from('agents').select('*').order('name'),
  ])

  if (leadsRes.error) {
    console.error('[SalesPage] leads query error:', leadsRes.error)
  }

  // El Admin ve todo; cada agente, solo sus leads (filtro server-side).
  const all = (leadsRes.data ?? []) as Lead[]
  const visible = isAdmin ? all : all.filter(l => leadOwnerId(l) === viewer?.id)

  return (
    <SalesPanel
      leads={visible}
      stages={stagesRes.data ?? []}
      agents={agentsRes.data ?? []}
      isAdmin={isAdmin}
    />
  )
}

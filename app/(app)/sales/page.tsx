import { createAdminClient } from '@/lib/supabase/admin'
import SalesPanel from '@/components/sales/sales-panel'

export default async function SalesPage() {
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
      .select('*, stage:pipeline_stages(id,name,position,key), property:properties(id,address,price_usd,price_ars,currency_listing), agent:agents(id,name,initials)')
      .order('created_at', { ascending: false }),
    supabase.from('pipeline_stages').select('*').order('position', { ascending: true }),
    supabase.from('agents').select('*').order('name'),
  ])

  if (leadsRes.error) {
    console.error('[SalesPage] leads query error:', leadsRes.error)
  }

  return (
    <SalesPanel
      leads={leadsRes.data ?? []}
      stages={stagesRes.data ?? []}
      agents={agentsRes.data ?? []}
    />
  )
}

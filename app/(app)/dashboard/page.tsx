import { createAdminClient } from '@/lib/supabase/admin'
import ExecutiveDashboard from '@/components/dashboard/executive-dashboard'

export default async function DashboardPage() {
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

  const [leadsRes, agentsRes, orgRes, propsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*, stage:pipeline_stages(id,name,position,key), property:properties(id,price_usd,price_ars,currency_listing)'),
    supabase.from('agents').select('*').order('name'),
    supabase.from('organization').select('*').limit(1).single(),
    supabase.from('properties').select('id,status').eq('status', 'Disponible'),
  ])

  if (leadsRes.error) {
    console.error('[DashboardPage] leads query error:', leadsRes.error)
  }

  return (
    <ExecutiveDashboard
      leads={leadsRes.data ?? []}
      agents={agentsRes.data ?? []}
      dollarRate={orgRes.data?.dollar_rate ?? 1200}
      activeProperties={propsRes.data?.length ?? 0}
    />
  )
}

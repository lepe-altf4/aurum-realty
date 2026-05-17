import { createClient } from '@/lib/supabase/server'
import ExecutiveDashboard from '@/components/dashboard/executive-dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [leadsRes, agentsRes, orgRes, propsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*, stage:pipeline_stages(id,name,position,key), property:properties(id,price_usd,price_ars,currency_listing)'),
    supabase
      .from('agents')
      .select('*')
      .order('name'),
    supabase
      .from('organization')
      .select('*')
      .limit(1)
      .single(),
    supabase
      .from('properties')
      .select('id,status')
      .eq('status', 'Disponible'),
  ])

  const leads = leadsRes.data ?? []
  const agents = agentsRes.data ?? []
  const org = orgRes.data
  const activeProperties = propsRes.data?.length ?? 0
  const dollarRate = org?.dollar_rate ?? 1200

  return (
    <ExecutiveDashboard
      leads={leads}
      agents={agents}
      dollarRate={dollarRate}
      activeProperties={activeProperties}
    />
  )
}

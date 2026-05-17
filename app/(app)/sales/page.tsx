import { createClient } from '@/lib/supabase/server'
import SalesPanel from '@/components/sales/sales-panel'

export default async function SalesPage() {
  const supabase = await createClient()

  const [leadsRes, stagesRes, agentsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*, stage:pipeline_stages(id,name,position,key), property:properties(id,address,price_usd,price_ars,currency_listing), agent:agents(id,name,initials)')
      .order('created_at', { ascending: false }),
    supabase
      .from('pipeline_stages')
      .select('*')
      .order('position', { ascending: true }),
    supabase
      .from('agents')
      .select('*')
      .order('name'),
  ])

  const leads = leadsRes.data ?? []
  const stages = stagesRes.data ?? []
  const agents = agentsRes.data ?? []

  return <SalesPanel leads={leads} stages={stages} agents={agents} />
}

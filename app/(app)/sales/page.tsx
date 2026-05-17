import { createAdminClient } from '@/lib/supabase/admin'
import SalesPanel from '@/components/sales/sales-panel'

export default async function SalesPage() {
  const supabase = createAdminClient()

  const [leadsRes, stagesRes, agentsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*, stage:pipeline_stages(id,name,position,key), property:properties(id,address,price_usd,price_ars,currency_listing), agent:agents(id,name,initials)')
      .order('created_at', { ascending: false }),
    supabase.from('pipeline_stages').select('*').order('position', { ascending: true }),
    supabase.from('agents').select('*').order('name'),
  ])

  return (
    <SalesPanel
      leads={leadsRes.data ?? []}
      stages={stagesRes.data ?? []}
      agents={agentsRes.data ?? []}
    />
  )
}

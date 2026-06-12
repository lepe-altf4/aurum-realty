import { createClient } from '@/lib/supabase/server'
import SalesPanel from '@/components/sales/sales-panel'

export const dynamic = 'force-dynamic'

export default async function SalesPage() {
  // Sesión del usuario: RLS limita los leads visibles según rol/dueño.
  const supabase = await createClient()

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

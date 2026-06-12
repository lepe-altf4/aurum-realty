import { createClient } from '@/lib/supabase/server'
import { ensureFreshDollarRate } from '@/lib/dollar'
import ExecutiveDashboard from '@/components/dashboard/executive-dashboard'
import type { Organization } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Sesión del usuario: RLS limita los leads visibles según rol/dueño.
  const supabase = await createClient()

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

  // Cotización automática: si el último update tiene +6hs, refresca de dolarapi.
  const org = await ensureFreshDollarRate(orgRes.data as Organization | null)

  return (
    <ExecutiveDashboard
      leads={leadsRes.data ?? []}
      agents={agentsRes.data ?? []}
      dollarRate={org?.dollar_rate ?? 1200}
      dollarUpdatedAt={org?.dollar_rate_updated_at ?? null}
      dollarSource={org?.dollar_rate_source ?? 'manual'}
      activeProperties={propsRes.data?.length ?? 0}
    />
  )
}

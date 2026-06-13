import { createAdminClient } from '@/lib/supabase/admin'
import { getViewer, leadOwnerId } from '@/lib/viewer'
import SalesPanel from '@/components/sales/sales-panel'
import type { Lead, Organization } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function SalesPage() {
  const { agent: viewer } = await getViewer()

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

  const [leadsRes, stagesRes, orgRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*, stage:pipeline_stages(id,name,position,key), property:properties(id,address,price_usd,price_ars,currency_listing), agent:agents!agent_id(id,name,initials)')
      .order('created_at', { ascending: false }),
    supabase.from('pipeline_stages').select('*').order('position', { ascending: true }),
    supabase.from('organization').select('dollar_rate').limit(1).single(),
  ])

  if (leadsRes.error) {
    console.error('[SalesPage] leads query error:', leadsRes.error)
  }

  // Panel personal: todos (Admin incluido) ven SOLO sus propios leads asignados.
  // La vista gerencial del equipo vive en el Ejecutivo, no acá.
  const all = (leadsRes.data ?? []) as Lead[]
  const visible = all.filter(l => leadOwnerId(l) === viewer?.id)

  return (
    <SalesPanel
      leads={visible}
      stages={stagesRes.data ?? []}
      dollarRate={(orgRes.data as Pick<Organization, 'dollar_rate'> | null)?.dollar_rate ?? 1200}
    />
  )
}

import { createClient } from '@/lib/supabase/server'
import LeadsHub from '@/components/leads/leads-hub'

export default async function LeadsPage() {
  const supabase = await createClient()

  const [leadsRes, stagesRes, agentsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*, property:properties(*), stage:pipeline_stages(*), agent:agents(*)')
      .order('created_at', { ascending: false }),
    supabase.from('pipeline_stages').select('*').order('position'),
    supabase.from('agents').select('*').eq('status', 'Activo').order('name'),
  ])

  // Log errors to Vercel function logs for debugging
  if (leadsRes.error)  console.error('[leads]',  leadsRes.error.code, leadsRes.error.message)
  if (stagesRes.error) console.error('[stages]', stagesRes.error.code, stagesRes.error.message)
  if (agentsRes.error) console.error('[agents]', agentsRes.error.code, agentsRes.error.message)
  console.log('[leads] count:', leadsRes.data?.length ?? 'null', '| error:', leadsRes.error?.code ?? 'none')

  const leads  = leadsRes.data
  const stages = stagesRes.data
  const agents = agentsRes.data

  return (
    <LeadsHub
      initialLeads={leads ?? []}
      stages={stages ?? []}
      agents={agents ?? []}
    />
  )
}

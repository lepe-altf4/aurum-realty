import { createAdminClient } from '@/lib/supabase/admin'
import LeadsHub from '@/components/leads/leads-hub'

export default async function LeadsPage() {
  const supabase = createAdminClient()

  const [leadsRes, stagesRes, agentsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*, property:properties(*), stage:pipeline_stages(*), agent:agents(*)')
      .order('created_at', { ascending: false }),
    supabase.from('pipeline_stages').select('*').order('position'),
    supabase.from('agents').select('*').eq('status', 'Activo').order('name'),
  ])

  return (
    <LeadsHub
      initialLeads={leadsRes.data ?? []}
      stages={stagesRes.data ?? []}
      agents={agentsRes.data ?? []}
    />
  )
}

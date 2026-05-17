import { createClient } from '@/lib/supabase/server'
import LeadsHub from '@/components/leads/leads-hub'

export default async function LeadsPage() {
  const supabase = await createClient()

  const [
    { data: leads },
    { data: stages },
    { data: agents },
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('*, property:properties(*), stage:pipeline_stages(*), agent:agents(*)')
      .order('created_at', { ascending: false }),
    supabase.from('pipeline_stages').select('*').order('position'),
    supabase.from('agents').select('*').eq('status', 'Activo').order('name'),
  ])

  return (
    <LeadsHub
      initialLeads={leads ?? []}
      stages={stages ?? []}
      agents={agents ?? []}
    />
  )
}

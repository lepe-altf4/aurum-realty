import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Temporary diagnostic endpoint — DELETE after debugging
// Visit /api/debug while logged in to see the actual DB state
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  const [leadsRes, propertiesRes, agentsRes, stagesRes] = await Promise.all([
    supabase.from('leads').select('id, name', { count: 'exact' }).limit(3),
    supabase.from('properties').select('id, address', { count: 'exact' }).limit(3),
    supabase.from('agents').select('id, name, role', { count: 'exact' }).limit(5),
    supabase.from('pipeline_stages').select('*'),
  ])

  return NextResponse.json({
    auth: {
      user: user ? { id: user.id, email: user.email } : null,
      error: authError?.message ?? null,
    },
    leads: {
      count: leadsRes.count,
      sample: leadsRes.data,
      error: leadsRes.error?.message ?? null,
      errorCode: leadsRes.error?.code ?? null,
    },
    properties: {
      count: propertiesRes.count,
      sample: propertiesRes.data,
      error: propertiesRes.error?.message ?? null,
    },
    agents: {
      count: agentsRes.count,
      sample: agentsRes.data,
      error: agentsRes.error?.message ?? null,
    },
    stages: {
      count: stagesRes.data?.length ?? 0,
      data: stagesRes.data,
      error: stagesRes.error?.message ?? null,
    },
  }, { status: 200 })
}

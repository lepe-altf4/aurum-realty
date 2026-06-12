import { createAdminClient } from '@/lib/supabase/admin'
import PropertiesView from '@/components/properties/properties-view'

export const dynamic = 'force-dynamic'

export default async function PropertiesPage() {
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

  const [propsRes, orgRes] = await Promise.all([
    supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('organization').select('dollar_rate').limit(1).single(),
  ])

  if (propsRes.error) {
    console.error('[PropertiesPage] properties query error:', propsRes.error)
  }

  return (
    <PropertiesView
      initialProperties={propsRes.data ?? []}
      dollarRate={orgRes.data?.dollar_rate ?? 0}
    />
  )
}

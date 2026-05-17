import { createAdminClient } from '@/lib/supabase/admin'
import PropertiesView from '@/components/properties/properties-view'

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

  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[PropertiesPage] properties query error:', error)
  }

  return <PropertiesView initialProperties={properties ?? []} />
}

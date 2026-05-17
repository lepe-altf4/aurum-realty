import { createAdminClient } from '@/lib/supabase/admin'
import PropertiesView from '@/components/properties/properties-view'

export default async function PropertiesPage() {
  const supabase = createAdminClient()

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  return <PropertiesView initialProperties={properties ?? []} />
}

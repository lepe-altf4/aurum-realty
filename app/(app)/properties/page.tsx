import { createClient } from '@/lib/supabase/server'
import PropertiesView from '@/components/properties/properties-view'

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  return <PropertiesView initialProperties={properties ?? []} />
}

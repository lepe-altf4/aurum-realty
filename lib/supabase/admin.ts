import 'server-only'
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      '[Aurum CRM] Missing NEXT_PUBLIC_SUPABASE_URL environment variable.'
    )
  }

  if (!key) {
    throw new Error(
      '[Aurum CRM] Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'Add it in Vercel → Project Settings → Environment Variables.'
    )
  }

  // Supabase is rolling out a new key format (sb_secret_...).
  // @supabase/supabase-js currently requires the legacy JWT format (eyJhb...).
  // If the new format is detected, throw a clear error instead of silently
  // failing with obscure PostgREST permission errors.
  if (key.startsWith('sb_secret_') || key.startsWith('sb_')) {
    throw new Error(
      '[Aurum CRM] SUPABASE_SERVICE_ROLE_KEY is in the new "sb_secret_..." format, ' +
      'which is not yet supported by @supabase/supabase-js. ' +
      'Please use the legacy JWT service role key (starts with "eyJhb...") from ' +
      'Supabase Dashboard → Project Settings → API → Service Role Secret (legacy).'
    )
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

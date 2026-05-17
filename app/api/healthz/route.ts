import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  const keyFormat = (k: string) => {
    if (!k) return 'MISSING'
    if (k.startsWith('eyJ')) return 'VALID_JWT'
    if (k.startsWith('sb_secret_') || k.startsWith('sb_')) return 'WRONG_FORMAT_sb_*'
    return `UNKNOWN(${k.substring(0, 8)}...)`
  }

  // Try a real DB query
  let dbResult: Record<string, unknown> = {}
  try {
    const admin = createAdminClient()
    const { data, error, count, status, statusText } = await admin
      .from('leads')
      .select('id', { count: 'exact', head: true })

    if (error) {
      dbResult = {
        ok: false,
        status,
        statusText,
        error_code: error.code,
        error_message: error.message,
        error_details: error.details,
        error_hint: error.hint,
      }
    } else {
      dbResult = { ok: true, leads_count: count ?? 0, status }
    }
  } catch (e) {
    dbResult = { ok: false, thrown: e instanceof Error ? e.message : String(e) }
  }

  return NextResponse.json({
    url: url ? url.substring(0, 40) + '...' : 'MISSING',
    anon_key_format: keyFormat(anonKey),
    service_role_key_format: keyFormat(serviceKey),
    db: dbResult,
  })
}

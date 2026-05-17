import { NextResponse } from 'next/server'

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

  return NextResponse.json({
    url: url ? url.substring(0, 40) + '...' : 'MISSING',
    anon_key_format: keyFormat(anonKey),
    service_role_key_format: keyFormat(serviceKey),
  })
}

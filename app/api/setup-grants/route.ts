import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export const runtime = 'nodejs'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const dbPassword = process.env.SUPABASE_DB_PASSWORD ?? ''

  if (!dbPassword) {
    return NextResponse.json({ error: 'SUPABASE_DB_PASSWORD not set' }, { status: 500 })
  }

  // Extract project ref from URL: https://rekvmbrdcpgeizwrftuo.supabase.co
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

  const pool = new Pool({
    connectionString: `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  try {
    const client = await pool.connect()
    try {
      const sql = `
        GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
      `
      await client.query(sql)

      // Verify it worked
      const check = await client.query('SELECT count(*) FROM leads')
      return NextResponse.json({
        ok: true,
        message: 'Grants applied successfully',
        leads_count: check.rows[0].count
      })
    } finally {
      client.release()
    }
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : String(e)
    }, { status: 500 })
  } finally {
    await pool.end()
  }
}

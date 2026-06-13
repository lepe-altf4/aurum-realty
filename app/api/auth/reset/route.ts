import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Reset de contraseña con dos modos según quién llama:
//  - Público (login, sin sesión): SOLO envía el email de recuperación.
//    Nunca devuelve un link (sería toma de cuentas: cualquiera generaría el
//    link de cualquier email).
//  - Admin autenticado (Settings → Equipo): además devuelve un link copiable
//    para mandar por WhatsApp, porque el solicitante ya está verificado.
export async function POST(req: Request) {
  let body: { email?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }
  const email = (body.email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  if (user) {
    const { data: caller } = await supabase.from('agents').select('role').eq('auth_user_id', user.id).single()
    isAdmin = caller?.role === 'Admin'
  }

  const origin = req.headers.get('origin') ?? new URL(req.url).origin
  const redirectTo = `${origin}/bienvenida`

  // ── Admin: generar link copiable (recovery) ──
  if (isAdmin) {
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo } })
    if (error) {
      return NextResponse.json({ error: `No se pudo generar el link: ${error.message}` }, { status: 500 })
    }
    return NextResponse.json({ reset_link: data.properties?.action_link ?? null })
  }

  // ── Público: solo enviar el email (no exponer link) ──
  // Nota: Supabase no revela si el email existe (anti-enumeración).
  await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  return NextResponse.json({ emailed: true })
}

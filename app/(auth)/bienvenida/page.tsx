'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Status = 'processing' | 'ready' | 'invalid' | 'saving'

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
  fontSize: 14, outline: 'none', background: 'var(--surface)',
  fontFamily: 'inherit', color: 'var(--ink)',
}

export default function BienvenidaPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('processing')
  const [name, setName] = useState<string | null>(null)
  const [isRecovery, setIsRecovery] = useState(false)
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')

  // El link de invitación redirige acá con los tokens en el hash
  // (#access_token=...&refresh_token=...). Los tomamos a mano para no
  // depender del flujo automático del cliente.
  useEffect(() => {
    const supabase = createClient()
    async function init() {
      const hash = new URLSearchParams(window.location.hash.substring(1))
      const errDesc = hash.get('error_description')
      if (errDesc) {
        setError(errDesc.replace(/\+/g, ' '))
        setStatus('invalid')
        return
      }
      if (hash.get('type') === 'recovery') setIsRecovery(true)
      const access_token = hash.get('access_token')
      const refresh_token = hash.get('refresh_token')
      if (access_token && refresh_token) {
        const { error: sessErr } = await supabase.auth.setSession({ access_token, refresh_token })
        if (!sessErr) {
          window.history.replaceState(null, '', window.location.pathname)
        }
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setName((session.user.user_metadata?.name as string) ?? null)
        setStatus('ready')
      } else {
        setStatus('invalid')
      }
    }
    init()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return }
    setStatus('saving')
    const supabase = createClient()
    const { error: updErr } = await supabase.auth.updateUser({ password })
    if (updErr) {
      setError(updErr.message)
      setStatus('ready')
      return
    }
    router.push('/leads')
    router.refresh()
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      padding: '40px 44px', width: 400, boxShadow: 'var(--shadow-md)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: 'var(--ink)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--gold)', fontFamily: 'var(--font-jakarta)', fontWeight: 800, fontSize: 18,
          marginBottom: 16,
        }}>A</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>
          {status === 'invalid'
            ? 'Link inválido'
            : isRecovery
              ? 'Restablecer contraseña'
              : `¡Bienvenido${name ? `, ${name.split(' ')[0]}` : ''}!`}
        </h1>
        <p style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 4 }}>
          {status === 'invalid'
            ? 'El link venció o ya fue usado'
            : isRecovery
              ? 'Elegí una contraseña nueva'
              : 'Creá tu contraseña para entrar al CRM'}
        </p>
      </div>

      {status === 'processing' && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-3)' }}>Verificando invitación…</p>
      )}

      {status === 'invalid' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0, textAlign: 'center' }}>{error}</p>}
          <p style={{ fontSize: 13, color: 'var(--ink-2)', textAlign: 'center', lineHeight: 1.6 }}>
            Pedile al administrador que te genere una invitación nueva desde
            Admin Settings → Equipo.
          </p>
          <a href="/login" style={{ textAlign: 'center', color: 'var(--gold)', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>
            Ir al inicio de sesión
          </a>
        </div>
      )}

      {(status === 'ready' || status === 'saving') && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Nueva contraseña</label>
            <input
              type="password" required autoFocus value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres" style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Repetir contraseña</label>
            <input
              type="password" required value={password2}
              onChange={e => setPassword2(e.target.value)}
              placeholder="••••••••" style={inputStyle}
            />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{error}</p>}
          <button
            type="submit" disabled={status === 'saving'}
            style={{
              marginTop: 6, padding: '10px 16px', borderRadius: 'var(--radius)',
              background: 'var(--accent)', color: '#fff', fontWeight: 600,
              fontSize: 14, border: 'none', cursor: status === 'saving' ? 'not-allowed' : 'pointer',
              opacity: status === 'saving' ? 0.7 : 1, fontFamily: 'inherit',
            }}
          >
            {status === 'saving' ? 'Guardando…' : 'Crear contraseña y entrar →'}
          </button>
        </form>
      )}
    </div>
  )
}

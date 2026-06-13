'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Status = 'processing' | 'ready' | 'invalid' | 'saving'

const inputStyle: React.CSSProperties = {
  padding: '9px 40px 9px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
  fontSize: 14, outline: 'none', background: 'var(--surface)',
  fontFamily: 'inherit', color: 'var(--ink)', width: '100%', boxSizing: 'border-box',
}

function EyeIcon({ off }: { off?: boolean }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}

const eyeBtnStyle: React.CSSProperties = {
  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)',
  padding: 4, display: 'grid', placeItems: 'center', lineHeight: 0,
}

export default function BienvenidaPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('processing')
  const [name, setName] = useState<string | null>(null)
  const [isRecovery, setIsRecovery] = useState(false)
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')

  // El link de invitación/reset llega de dos formas posibles:
  //  1) Nuevo: a nuestro dominio con ?token_hash=...&type=invite|magiclink|recovery.
  //     El token se canjea acá, en el cliente (verifyOtp). Como los bots de
  //     previsualización de WhatsApp/email no ejecutan JS, no lo queman antes
  //     de que la persona haga clic.
  //  2) Viejo (SMTP de Supabase): redirige con los tokens en el hash
  //     (#access_token=...&refresh_token=...). Lo dejamos como fallback.
  useEffect(() => {
    const supabase = createClient()
    async function init() {
      const query = new URLSearchParams(window.location.search)
      const hash = new URLSearchParams(window.location.hash.substring(1))

      const errDesc = hash.get('error_description') ?? query.get('error_description')
      if (errDesc) {
        setError(errDesc.replace(/\+/g, ' '))
        setStatus('invalid')
        return
      }

      const tokenHash = query.get('token_hash')
      const tokenType = query.get('type')
      if (tokenHash && tokenType) {
        if (tokenType === 'recovery') setIsRecovery(true)
        const { error: vErr } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: tokenType as 'invite' | 'magiclink' | 'recovery',
        })
        if (vErr) {
          setError(vErr.message)
        } else {
          window.history.replaceState(null, '', window.location.pathname)
        }
      } else {
        if (hash.get('type') === 'recovery') setIsRecovery(true)
        const access_token = hash.get('access_token')
        const refresh_token = hash.get('refresh_token')
        if (access_token && refresh_token) {
          const { error: sessErr } = await supabase.auth.setSession({ access_token, refresh_token })
          if (!sessErr) {
            window.history.replaceState(null, '', window.location.pathname)
          }
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
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'} required autoFocus value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres" style={inputStyle}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} title={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'} style={eyeBtnStyle}>
                <EyeIcon off={showPwd} />
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Repetir contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'} required value={password2}
                onChange={e => setPassword2(e.target.value)}
                placeholder="••••••••" style={inputStyle}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} title={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'} style={eyeBtnStyle}>
                <EyeIcon off={showPwd} />
              </button>
            </div>
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

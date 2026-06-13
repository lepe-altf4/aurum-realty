'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Agent } from '@/lib/types'

const NAV: { href: string; label: string; icon: string; adminOnly?: boolean; agentOnly?: boolean; exact?: boolean }[] = [
  { href: '/leads/pozo', label: 'Pozo de Leads',      icon: 'pool' },
  { href: '/leads',      label: 'Mis Leads',          icon: 'leads', exact: true },
  { href: '/pipeline',   label: 'Pipeline',           icon: 'pipeline' },
  { href: '/sales',      label: 'Panel de Ventas',    icon: 'sales', agentOnly: true },
  { href: '/properties', label: 'Propiedades',        icon: 'property' },
  { href: '/dashboard',  label: 'Executive Dashboard',icon: 'dashboard', adminOnly: true },
  { href: '/settings',   label: 'Admin Settings',     icon: 'settings', adminOnly: true },
]

function NavIcon({ type }: { type: string }) {
  const s = { width: 16, height: 16, flexShrink: 0 as const }
  if (type === 'pool') return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
  if (type === 'leads') return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.7-3 3-4.5 5.5-4.5S13.8 16 14.5 19"/><circle cx="17" cy="9" r="2.5"/><path d="M14.5 14.4c2.4 0 5 1.2 5.5 4.6"/></svg>
  if (type === 'pipeline') return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="4.5" height="16" rx="1"/><rect x="9.75" y="4" width="4.5" height="11" rx="1"/><rect x="16.5" y="4" width="4.5" height="7" rx="1"/></svg>
  if (type === 'sales') return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l5-5 4 4 8-9"/><path d="M14 7h6v6"/></svg>
  if (type === 'property') return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 4l9 6.5"/><path d="M5 9.8V20h14V9.8"/><path d="M10 20v-5h4v5"/></svg>
  if (type === 'dashboard') return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></svg>
  if (type === 'settings') return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
  if (type === 'sparkle') return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>
  if (type === 'bell') return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 6 1.5 6h-15S6 12 6 8z"/><path d="M10 18a2 2 0 0 0 4 0"/></svg>
  if (type === 'pin') return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>
  return null
}

export default function Sidebar({ agent }: { agent: Agent | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = agent?.role === 'Admin'
  const [open, setOpen] = useState(false)
  const [pendingClaims, setPendingClaims] = useState(0)

  // Badge de reclamos pendientes para el Admin: cuenta inicial +
  // actualización en vivo vía Supabase Realtime sobre lead_claims.
  useEffect(() => {
    if (!isAdmin) return
    const sb = createClient()
    let active = true

    async function loadCount() {
      const { count, error } = await sb
        .from('lead_claims')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'pendiente')
      if (active && !error) setPendingClaims(count ?? 0)
    }
    loadCount()

    const channel = sb
      .channel('lead-claims-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_claims' }, loadCount)
      .subscribe()

    return () => {
      active = false
      sb.removeChannel(channel)
    }
  }, [isAdmin])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = agent?.initials ?? agent?.name?.slice(0,2).toUpperCase() ?? 'AR'
  const displayName = agent?.name ?? 'Usuario'
  const displayRole = agent?.role ?? 'Agente'

  return (
    <>
    {/* Botón hamburguesa — visible solo en mobile (ver globals.css) */}
    <button className="sidebar-toggle" onClick={() => setOpen(o => !o)} aria-label="Abrir menú">
      {open ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      )}
    </button>
    <div className={'sidebar-overlay' + (open ? ' show' : '')} onClick={() => setOpen(false)} />
    <aside className={'sidebar' + (open ? ' open' : '')} style={{
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      padding: '22px 14px 18px',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh',
      width: 'var(--sidebar-w)',
      overflowY: 'auto',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 22px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: 'var(--ink)',
          display: 'grid', placeItems: 'center', color: 'var(--gold)',
          fontFamily: 'var(--font-jakarta)', fontWeight: 800, fontSize: 15,
          letterSpacing: '0.02em', flexShrink: 0,
        }}>A</div>
        <div>
          <div style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em' }}>AURUM</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 1 }}>Realty CRM</div>
        </div>
      </div>

      {/* Main nav */}
      <div style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-4)', fontWeight: 600, padding: '14px 8px 6px' }}>Workspace</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.filter(item => (!item.adminOnly || isAdmin) && (!item.agentOnly || !isAdmin)).map(item => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '9px 10px', borderRadius: 'var(--radius-sm)',
              color: active ? '#fff' : 'var(--ink-2)',
              fontWeight: 500, fontSize: 13.5,
              cursor: 'pointer', userSelect: 'none',
              background: active ? 'var(--ink)' : 'transparent',
              textDecoration: 'none',
              transition: 'background .12s ease, color .12s ease',
            }}>
              <span style={{ color: active ? 'var(--gold)' : 'var(--ink-3)' }}>
                <NavIcon type={item.icon} />
              </span>
              <span>{item.label}</span>
              {item.href === '/leads/pozo' && pendingClaims > 0 && (
                <span title={`${pendingClaims} reclamo${pendingClaims === 1 ? '' : 's'} pendiente${pendingClaims === 1 ? '' : 's'} de aprobación`} style={{
                  marginLeft: 'auto', minWidth: 18, height: 18, padding: '0 5px',
                  borderRadius: 999, background: 'var(--danger)', color: '#fff',
                  fontSize: 10.5, fontWeight: 700, display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {pendingClaims > 99 ? '99+' : pendingClaims}
                </span>
              )}
            </a>
          )
        })}
      </div>

      {/* Saved views */}
      <div style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-4)', fontWeight: 600, padding: '14px 8px 6px' }}>Saved Views</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[
          { label: 'Leads premium', icon: 'sparkle', href: '/leads?view=premium' },
          { label: 'Atrasados +5 días', icon: 'bell', href: '/leads?view=atrasados' },
          { label: 'Centro & Área Este', icon: 'pin', href: '/leads?view=centro-sp' },
        ].map(v => (
          <a key={v.label} href={v.href} onClick={() => setOpen(false)} style={{
            display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px',
            borderRadius: 'var(--radius-sm)', color: 'var(--ink-2)', fontWeight: 500,
            fontSize: 13.5, textDecoration: 'none',
          }}>
            <span style={{ color: 'var(--ink-3)' }}><NavIcon type={v.icon} /></span>
            <span>{v.label}</span>
          </a>
        ))}
      </div>

      {/* Footer / user */}
      <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: 'var(--ink)', color: 'var(--gold)',
          display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 12, flexShrink: 0,
        }}>{initials}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{displayRole} · Aurum</div>
        </div>
        <button
          onClick={handleSignOut}
          title="Cerrar sesión"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--ink-3)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
    </>
  )
}

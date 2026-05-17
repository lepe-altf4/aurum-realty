import type { ReactNode } from 'react'

export default function Topbar({
  title, crumb, right, search = true,
}: {
  title: string
  crumb?: string
  right?: ReactNode
  search?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '16px 32px', borderBottom: '1px solid var(--border)',
      background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 30,
    }}>
      <div>
        {crumb && <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{crumb}</div>}
        <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>{title}</h1>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {search && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface)', border: '1px solid transparent',
            borderRadius: 'var(--radius)', padding: '8px 12px', minWidth: 280,
            color: 'var(--ink-3)', fontSize: 13,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input placeholder="Buscar leads, propiedades…" style={{ background: 'transparent', border: 0, outline: 0, flex: 1, fontFamily: 'inherit', fontSize: 13, color: 'var(--ink)' }} />
          </div>
        )}
        {right}
      </div>
    </div>
  )
}

'use client'
import { useState, useMemo } from 'react'
import Topbar from '@/components/ui/topbar'
import { StatusTag, OpTag, Tag } from '@/components/ui/tags'
import TypeIcon from '@/components/ui/type-icon'
import { fmtUSD, fmtARS } from '@/lib/format'
import type { Property } from '@/lib/types'
import NewPropertyModal from '@/components/properties/new-property-modal'

const TYPES = ['Todos', 'Casa', 'Departamento', 'Lote', 'Local']

function MiniStat({ label, value, sub, accent }: { label: string; value: number; sub: string; accent?: 'gold' | 'success' }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>{label}</div>
      <div className="num" style={{
        fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 24, marginTop: 6,
        color: accent === 'success' ? 'var(--success)' : accent === 'gold' ? 'var(--gold)' : 'var(--ink)',
      }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

export default function PropertiesView({ initialProperties }: { initialProperties: Property[] }) {
  const [properties, setProperties] = useState<Property[]>(initialProperties)
  const [opFilter, setOpFilter] = useState('Todas')
  const [typeFilter, setTypeFilter] = useState('Todos')
  const [showNewProperty, setShowNewProperty] = useState(false)

  const filtered = useMemo(() =>
    properties.filter(p =>
      (opFilter === 'Todas' || p.operation === opFilter) &&
      (typeFilter === 'Todos' || p.type === typeFilter)
    ),
    [properties, opFilter, typeFilter]
  )

  const stats = useMemo(() => ({
    total: properties.length,
    disponible: properties.filter(p => p.status === 'Disponible').length,
    reservada: properties.filter(p => p.status === 'Reservada').length,
    vendida: properties.filter(p => p.status === 'Vendida').length,
    alquiler: properties.filter(p => p.operation === 'Alquiler').length,
  }), [properties])

  function handlePropertyCreated(prop: Property) {
    setProperties(prev => [prop, ...prev])
  }

  return (
    <>
      <Topbar
        crumb="WORKSPACE · INVENTARIO"
        title="Propiedades"
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 13, border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12m0 0-4-4m4 4 4-4M5 20h14"/></svg>
              Importar ZonaProp
            </button>
            <button onClick={() => setShowNewProperty(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 13, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Nueva Propiedad
            </button>
          </div>
        }
      />

      <div style={{ padding: '24px 32px 48px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 18 }}>
          <MiniStat label="Inventario total" value={stats.total}      sub="propiedades activas" />
          <MiniStat label="Disponibles"      value={stats.disponible} sub="listas para mostrar" />
          <MiniStat label="Reservadas"       value={stats.reservada}  sub="con seña en curso"   accent="gold" />
          <MiniStat label="Vendidas mes"     value={stats.vendida}    sub="cerradas"            accent="success" />
          <MiniStat label="En alquiler"      value={stats.alquiler}   sub="renta mensual" />
        </div>

        {/* Table card */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          {/* Filter bar */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-3)', flexShrink: 0 }}><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>
            <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', fontWeight: 600 }}>Operación</span>
            {['Todas', 'Venta', 'Alquiler'].map(o => (
              <button key={o} onClick={() => setOpFilter(o)} style={{ padding: '7px 11px', borderRadius: 8, border: '1px solid var(--border)', background: opFilter === o ? 'var(--ink)' : '#fff', color: opFilter === o ? '#fff' : 'var(--ink-2)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}>{o}</button>
            ))}
            <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }} />
            <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', fontWeight: 600 }}>Tipo</span>
            {TYPES.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '7px 11px', borderRadius: 8, border: '1px solid var(--border)', background: typeFilter === t ? 'var(--ink)' : '#fff', color: typeFilter === t ? '#fff' : 'var(--ink-2)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}>{t}</button>
            ))}
            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-3)' }}>{filtered.length} resultados</div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  {['', 'Propiedad', 'Tipo', 'Barrio', 'M²', 'Amb.', 'Precio USD', 'Precio ARS', 'Operación', 'Estado', ''].map((h, i) => (
                    <th key={i} style={{
                      textAlign: [4,5,6,7].includes(i) ? 'right' : 'left',
                      fontSize: 10.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'var(--ink-3)', padding: '12px 14px', borderBottom: '1px solid var(--border)',
                      background: '#fff', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}
                    style={{ cursor: 'pointer', transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FBFAF7')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', width: 30 }}>
                      <input type="checkbox" onClick={e => e.stopPropagation()} />
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 56, height: 42, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border)', position: 'relative' }}>
                          {p.photo_url ? (
                            <img src={p.photo_url} alt={p.address} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, #EFEAE0 0 6px, #F8F6F2 6px 12px)', display: 'grid', placeItems: 'center' }}>
                              <span style={{ fontSize: 9, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>IMG</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13.5 }}>{p.address}</span>
                            {p.premium && <Tag variant="gold">PREMIUM</Tag>}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{p.id.slice(0,8).toUpperCase()} · {p.neighborhood}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--surface)', display: 'grid', placeItems: 'center', color: 'var(--ink-2)', flexShrink: 0 }}>
                          <TypeIcon type={p.type} size={13} />
                        </span>
                        <span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{p.type}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', fontSize: 13.5, color: 'var(--ink-2)' }}>{p.neighborhood}</td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13.5 }}>{p.sqm?.toLocaleString('es-AR') || '—'}</td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13.5 }}>{p.rooms || '—'}</td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        {p.currency_listing === 'USD' && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3, letterSpacing: '0.08em', background: 'var(--ink)', color: '#fff' }}>LISTADO</span>}
                        <span style={{ fontWeight: p.currency_listing === 'USD' ? 700 : 500, color: p.currency_listing === 'USD' ? 'var(--ink)' : 'var(--ink-3)', fontSize: 13.5 }}>
                          {p.price_usd ? fmtUSD(p.price_usd) + (p.operation === 'Alquiler' ? '/mes' : '') : '—'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        {p.currency_listing === 'ARS' && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3, letterSpacing: '0.08em', background: 'var(--gold)', color: 'var(--ink)' }}>LISTADO</span>}
                        <span style={{ fontWeight: p.currency_listing === 'ARS' ? 700 : 500, color: p.currency_listing === 'ARS' ? 'var(--ink)' : 'var(--ink-3)', fontSize: 13.5 }}>
                          {p.price_ars ? fmtARS(p.price_ars) + (p.operation === 'Alquiler' ? '/mes' : '') : '—'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}><OpTag op={p.operation} /></td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}><StatusTag status={p.status} /></td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button title="Ver" style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff', color: 'var(--ink-2)', cursor: 'pointer' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button title="Más" style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff', color: 'var(--ink-2)', cursor: 'pointer' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>No hay propiedades que coincidan</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showNewProperty && (
        <NewPropertyModal
          onClose={() => setShowNewProperty(false)}
          onCreated={handlePropertyCreated}
        />
      )}
    </>
  )
}

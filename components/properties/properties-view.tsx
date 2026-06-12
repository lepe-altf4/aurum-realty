'use client'
import { useState, useMemo } from 'react'
import Topbar from '@/components/ui/topbar'
import { StatusTag, OpTag, Tag } from '@/components/ui/tags'
import TypeIcon from '@/components/ui/type-icon'
import { fmtUSD, fmtARS } from '@/lib/format'
import type { Property } from '@/lib/types'
import NewPropertyModal from '@/components/properties/new-property-modal'
import PhotoManager from '@/components/properties/photo-manager'
import { createClient } from '@/lib/supabase/client'

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

// Precios efectivos: la moneda de listado manda; la otra se recalcula con la
// cotización vigente de la organización (si está disponible).
function effectiveUsd(p: Property, rate: number): number | null {
  if (p.currency_listing === 'USD') return p.price_usd
  if (rate > 0 && p.price_ars) return p.price_ars / rate
  return p.price_usd
}
function effectiveArs(p: Property, rate: number): number | null {
  if (p.currency_listing === 'ARS') return p.price_ars
  if (rate > 0 && p.price_usd) return p.price_usd * rate
  return p.price_ars
}

// ── Property detail modal ─────────────────────────────────────────────────────
function PropertyDetailModal({ property, dollarRate = 0, onClose, onCoverChange }: { property: Property; dollarRate?: number; onClose: () => void; onCoverChange?: (propertyId: string, coverUrl: string | null) => void }) {
  const [coverUrl, setCoverUrl] = useState<string | null>(property.photo_url)

  function handleCover(url: string | null) {
    setCoverUrl(url)
    onCoverChange?.(property.id, url)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(36,25,17,0.4)', backdropFilter: 'blur(2px)', zIndex: 80 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, maxHeight: '90vh', overflowY: 'auto',
        background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
        boxShadow: '0 24px 80px rgba(36,25,17,.22)', zIndex: 90,
      }}>
        {/* Photo */}
        <div style={{ position: 'relative', height: 220, background: 'var(--surface)', overflow: 'hidden', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
          {coverUrl ? (
            <img src={coverUrl} alt={property.address} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, #EFEAE0 0 8px, #F8F6F2 8px 16px)', display: 'grid', placeItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>Sin fotografía</span>
            </div>
          )}
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.9)', border: 'none', borderRadius: '50%', cursor: 'pointer', color: 'var(--ink)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
          {property.premium && (
            <div style={{ position: 'absolute', top: 12, left: 12, padding: '3px 10px', background: 'var(--gold)', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>PREMIUM</div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{property.address}</h2>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                {property.id.slice(0, 8).toUpperCase()} · {property.neighborhood}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <OpTag op={property.operation} />
              <StatusTag status={property.status} />
            </div>
          </div>

          {/* Grid of details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Tipo', value: property.type },
              { label: 'Barrio', value: property.neighborhood || '—' },
              { label: 'Superficie', value: property.sqm ? `${property.sqm.toLocaleString('es-AR')} m²` : '—' },
              { label: 'Ambientes', value: property.rooms ? String(property.rooms) : '—' },
              { label: 'Moneda listing', value: property.currency_listing },
              { label: 'Operación', value: property.operation },
            ].map(f => (
              <div key={f.label} style={{ padding: '12px 14px', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{f.value}</div>
              </div>
            ))}
          </div>

          {/* Prices */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            {effectiveUsd(property, dollarRate) && (
              <div style={{ padding: '16px', background: property.currency_listing === 'USD' ? 'var(--ink)' : 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: property.currency_listing === 'USD' ? 'rgba(255,255,255,.6)' : 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  Precio USD {property.currency_listing === 'USD' ? '· LISTADO' : ''}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: property.currency_listing === 'USD' ? '#fff' : 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtUSD(effectiveUsd(property, dollarRate) ?? 0)}{property.operation === 'Alquiler' ? '/mes' : ''}
                </div>
              </div>
            )}
            {effectiveArs(property, dollarRate) && (
              <div style={{ padding: '16px', background: property.currency_listing === 'ARS' ? 'var(--gold-soft)' : 'var(--surface)', borderRadius: 'var(--radius)', border: `1px solid ${property.currency_listing === 'ARS' ? '#E2D4B5' : 'var(--border)'}` }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: property.currency_listing === 'ARS' ? '#8E6840' : 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  Precio ARS {property.currency_listing === 'ARS' ? '· LISTADO' : ''}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: property.currency_listing === 'ARS' ? '#6E5630' : 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtARS(effectiveArs(property, dollarRate) ?? 0)}{property.operation === 'Alquiler' ? '/mes' : ''}
                </div>
              </div>
            )}
          </div>

          {property.description && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Descripción</div>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>{property.description}</p>
            </div>
          )}

          {/* Fotos */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Fotos</div>
            <PhotoManager propertyId={property.id} onCoverChange={handleCover} />
          </div>
        </div>
      </div>
    </>
  )
}

// ── ZonaProp import modal ─────────────────────────────────────────────────────
function ZonaPropModal({ onClose, onImported }: { onClose: () => void; onImported: (p: Property) => void }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleImport() {
    const trimmed = url.trim()
    if (!trimmed) return
    if (!trimmed.includes('zonaprop.com.ar')) {
      setError('Ingresá una URL válida de ZonaProp')
      return
    }
    setLoading(true)
    setError('')
    // Parse listing ID from URL: zonaprop.com.ar/.../XXXXXXXX.html
    const match = trimmed.match(/(\d{6,})/)
    const listingId = match?.[1] ?? Date.now().toString()

    // Since we cannot fetch external URLs from the browser due to CORS,
    // we create a placeholder property with the URL as source
    const { data, error: insertError } = await supabase
      .from('properties')
      .insert({
        address: `Importado de ZonaProp · ID ${listingId}`,
        neighborhood: null,
        type: 'Departamento',
        operation: 'Venta',
        status: 'Disponible',
        currency_listing: 'USD',
        price_usd: null,
        price_ars: null,
        premium: false,
        description: `Importado desde: ${trimmed}`,
      })
      .select()
      .single()

    if (insertError) {
      setError('Error al importar. Verificá tu conexión.')
    } else if (data) {
      onImported(data as Property)
      onClose()
    }
    setLoading(false)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(36,25,17,0.4)', backdropFilter: 'blur(2px)', zIndex: 80 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 460, background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(36,25,17,.22)', zIndex: 90, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>IMPORTAR</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>Importar desde ZonaProp</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: '12px 16px', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-3)' }}>
            Pegá la URL de la publicación de ZonaProp y la importaremos a tu inventario.
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>URL de la publicación</div>
            <input
              autoFocus
              value={url}
              onChange={e => { setUrl(e.target.value); setError('') }}
              placeholder="https://www.zonaprop.com.ar/propiedades/..."
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`, fontSize: 13, fontFamily: 'inherit', color: 'var(--ink)', outline: 'none' }}
            />
            {error && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{error}</div>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--ink)' }}>
              Cancelar
            </button>
            <button onClick={handleImport} disabled={loading || !url.trim()} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--ink)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: url.trim() && !loading ? 'pointer' : 'not-allowed', opacity: url.trim() && !loading ? 1 : 0.5 }}>
              {loading ? 'Importando…' : 'Importar propiedad'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Property row context menu ─────────────────────────────────────────────────
function ContextMenu({ property, onClose, onStatusChange, onDelete }: {
  property: Property
  onClose: () => void
  onStatusChange: (id: string, status: Property['status']) => void
  onDelete: (id: string) => void
}) {
  const supabase = createClient()
  const statuses: Property['status'][] = ['Disponible', 'Reservada', 'Vendida', 'Alquilada']

  async function changeStatus(status: Property['status']) {
    onClose()
    await supabase.from('properties').update({ status }).eq('id', property.id)
    onStatusChange(property.id, status)
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${property.address}"? Esta acción no se puede deshacer.`)) return
    onClose()
    await supabase.from('properties').delete().eq('id', property.id)
    onDelete(property.id)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
      <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(36,25,17,.12)', zIndex: 30, minWidth: 200, overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--border)' }}>
          Cambiar estado
        </div>
        {statuses.filter(s => s !== property.status).map(status => (
          <div
            key={status}
            onClick={() => changeStatus(status)}
            style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--ink)', background: '#fff', borderBottom: '1px solid var(--border)', transition: 'background .1s' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#fff'}>
            → {status}
          </div>
        ))}
        <div
          onClick={handleDelete}
          style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--danger)', background: '#fff', transition: 'background .1s' }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#FBE8E5'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#fff'}>
          Eliminar propiedad
        </div>
      </div>
    </>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function PropertiesView({ initialProperties, dollarRate = 0 }: { initialProperties: Property[]; dollarRate?: number }) {
  const [properties, setProperties] = useState<Property[]>(initialProperties)
  const [opFilter, setOpFilter] = useState('Todas')
  const [typeFilter, setTypeFilter] = useState('Todos')
  const [search, setSearch] = useState('')
  const [showNewProperty, setShowNewProperty] = useState(false)
  const [showZonaProp, setShowZonaProp] = useState(false)
  const [detailProperty, setDetailProperty] = useState<Property | null>(null)
  const [contextMenuId, setContextMenuId] = useState<string | null>(null)

  const filtered = useMemo(() =>
    properties.filter(p =>
      (opFilter === 'Todas' || p.operation === opFilter) &&
      (typeFilter === 'Todos' || p.type === typeFilter) &&
      (search.trim() === '' || p.address.toLowerCase().includes(search.toLowerCase()) || (p.neighborhood || '').toLowerCase().includes(search.toLowerCase()))
    ),
    [properties, opFilter, typeFilter, search]
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

  function handleStatusChange(id: string, status: Property['status']) {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  function handleDelete(id: string) {
    setProperties(prev => prev.filter(p => p.id !== id))
  }

  function handleCoverChange(id: string, coverUrl: string | null) {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, photo_url: coverUrl } : p))
    setDetailProperty(prev => prev && prev.id === id ? { ...prev, photo_url: coverUrl } : prev)
  }

  return (
    <>
      <Topbar
        crumb="WORKSPACE · INVENTARIO"
        title="Propiedades"
        search={false}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowZonaProp(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 13, border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12m0 0-4-4m4 4 4-4M5 20h14" /></svg>
              Importar ZonaProp
            </button>
            <button onClick={() => setShowNewProperty(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 13, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              Nueva Propiedad
            </button>
          </div>
        }
      />

      <div className="page-pad" style={{ padding: '24px 32px 48px' }}>
        {/* Stats */}
        <div className="stat-grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 18 }}>
          <MiniStat label="Inventario total" value={stats.total} sub="propiedades activas" />
          <MiniStat label="Disponibles" value={stats.disponible} sub="listas para mostrar" />
          <MiniStat label="Reservadas" value={stats.reservada} sub="con seña en curso" accent="gold" />
          <MiniStat label="Vendidas mes" value={stats.vendida} sub="cerradas" accent="success" />
          <MiniStat label="En alquiler" value={stats.alquiler} sub="renta mensual" />
        </div>

        {/* Table card */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          {/* Filter bar */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginRight: 4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 9, color: 'var(--ink-3)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar dirección o barrio..."
                style={{ paddingLeft: 30, paddingRight: search ? 28 : 10, paddingTop: 7, paddingBottom: 7, borderRadius: 8, border: '1px solid var(--border)', fontSize: 12.5, fontFamily: 'inherit', color: 'var(--ink)', outline: 'none', width: 210 }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0, display: 'grid', placeItems: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
                </button>
              )}
            </div>

            <div style={{ width: 1, height: 22, background: 'var(--border)' }} />

            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-3)', flexShrink: 0 }}><path d="M3 5h18l-7 9v6l-4-2v-4z" /></svg>
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
                      textAlign: [4, 5, 6, 7].includes(i) ? 'right' : 'left',
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
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }} onClick={() => setDetailProperty(p)}>
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
                          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{p.id.slice(0, 8).toUpperCase()} · {p.neighborhood}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }} onClick={() => setDetailProperty(p)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--surface)', display: 'grid', placeItems: 'center', color: 'var(--ink-2)', flexShrink: 0 }}>
                          <TypeIcon type={p.type} size={13} />
                        </span>
                        <span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{p.type}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', fontSize: 13.5, color: 'var(--ink-2)' }} onClick={() => setDetailProperty(p)}>{p.neighborhood}</td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13.5 }} onClick={() => setDetailProperty(p)}>{p.sqm?.toLocaleString('es-AR') || '—'}</td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13.5 }} onClick={() => setDetailProperty(p)}>{p.rooms || '—'}</td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }} onClick={() => setDetailProperty(p)}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        {p.currency_listing === 'USD' && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3, letterSpacing: '0.08em', background: 'var(--ink)', color: '#fff' }}>LISTADO</span>}
                        <span style={{ fontWeight: p.currency_listing === 'USD' ? 700 : 500, color: p.currency_listing === 'USD' ? 'var(--ink)' : 'var(--ink-3)', fontSize: 13.5 }}>
                          {effectiveUsd(p, dollarRate) ? fmtUSD(effectiveUsd(p, dollarRate)!) + (p.operation === 'Alquiler' ? '/mes' : '') : '—'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }} onClick={() => setDetailProperty(p)}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        {p.currency_listing === 'ARS' && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3, letterSpacing: '0.08em', background: 'var(--gold)', color: 'var(--ink)' }}>LISTADO</span>}
                        <span style={{ fontWeight: p.currency_listing === 'ARS' ? 700 : 500, color: p.currency_listing === 'ARS' ? 'var(--ink)' : 'var(--ink-3)', fontSize: 13.5 }}>
                          {effectiveArs(p, dollarRate) ? fmtARS(effectiveArs(p, dollarRate)!) + (p.operation === 'Alquiler' ? '/mes' : '') : '—'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }} onClick={() => setDetailProperty(p)}><OpTag op={p.operation} /></td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }} onClick={() => setDetailProperty(p)}><StatusTag status={p.status} /></td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          title="Ver detalle"
                          onClick={() => setDetailProperty(p)}
                          style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff', color: 'var(--ink-2)', cursor: 'pointer' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
                        </button>
                        <div style={{ position: 'relative' }}>
                          <button
                            title="Más opciones"
                            onClick={() => setContextMenuId(id => id === p.id ? null : p.id)}
                            style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: contextMenuId === p.id ? 'var(--ink)' : '#fff', color: contextMenuId === p.id ? '#fff' : 'var(--ink-2)', cursor: 'pointer' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></svg>
                          </button>
                          {contextMenuId === p.id && (
                            <ContextMenu
                              property={p}
                              onClose={() => setContextMenuId(null)}
                              onStatusChange={handleStatusChange}
                              onDelete={handleDelete}
                            />
                          )}
                        </div>
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

      {showZonaProp && (
        <ZonaPropModal
          onClose={() => setShowZonaProp(false)}
          onImported={handlePropertyCreated}
        />
      )}

      {detailProperty && (
        <PropertyDetailModal
          property={detailProperty}
          dollarRate={dollarRate}
          onClose={() => setDetailProperty(null)}
          onCoverChange={handleCoverChange}
        />
      )}
    </>
  )
}

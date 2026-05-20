'use client'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Topbar from '@/components/ui/topbar'
import { SourceTag, StageTag, OpTag, Tag } from '@/components/ui/tags'
import LeadDrawer from '@/components/leads/lead-drawer'
import NewLeadModal from '@/components/leads/new-lead-modal'
import type { Lead, PipelineStage, Agent, Property } from '@/lib/types'

const ORIGINS = ['WhatsApp','Instagram','ZonaProp','Argenprop','Web','Referido']

type SavedView = null | 'premium' | 'atrasados' | 'palermo'

function SummaryStat({ label, value, sub, color }: { label: string; value: string|number; sub: string; color?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>{label}</div>
      <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 24, marginTop: 6, letterSpacing: '-0.02em', color: color || 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

function IconBtn({ title, onClick, children, color }: { title: string; onClick?: (e: React.MouseEvent) => void; children: React.ReactNode; color?: string }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 32, height: 32, display: 'grid', placeItems: 'center',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff',
      color: color || 'var(--ink-2)', cursor: 'pointer',
    }}>{children}</button>
  )
}

function exportCSV(leads: Lead[]) {
  const headers = ['Nombre','Teléfono','Email','Origen','Operación','Etapa','Agente','Monto','Moneda','Score','Días sin contacto','Fecha']
  const rows = leads.map(l => [
    l.name, l.phone || '', l.email || '', l.origin || '',
    l.operation || '', l.stage?.name || '', l.agent?.name || '',
    l.amount || '', l.currency, l.score, l.days_without_contact,
    new Date(l.created_at).toLocaleDateString('es-AR'),
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leads-aurum-${new Date().toISOString().slice(0,10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Reactivation sequence modal
function ReactivationModal({ leads, onClose, onOpenLead }: { leads: Lead[]; onClose: () => void; onOpenLead: (l: Lead) => void }) {
  const [idx, setIdx] = useState(0)
  const current = leads[idx]
  if (!current) return null
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(36,25,17,0.5)', backdropFilter: 'blur(3px)', zIndex: 80 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 480, background: '#fff', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(36,25,17,.22)', zIndex: 90, overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, #FBE8E5, var(--surface))' }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--danger)' }}>Secuencia de reactivación</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>Lead {idx + 1} de {leads.length}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--danger-soft)', display: 'grid', placeItems: 'center', flexShrink: 0, border: '1px solid #E9CDC9' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--danger)' }}>{current.name.slice(0,2).toUpperCase()}</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{current.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{current.phone} · <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{current.days_without_contact}d sin contacto</span></div>
            </div>
          </div>
          {current.days_without_contact >= 10 && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', background: '#FEF3C7', border: '1px solid #F59E0B', fontSize: 12, color: '#92400E', marginBottom: 12 }}>
              ⚠ +10 días sin contacto — Considerar reasignar a otro agente
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Etapa</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{current.stage?.name || '—'}</div>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Agente</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{current.agent?.name || 'Sin asignar'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => window.open(`https://wa.me/${current.phone?.replace(/\D/g,'')}`, '_blank')} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--success)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 1 1-3.4-6.5L20 4l-1.5 3.6A8 8 0 0 1 20 12z"/><path d="M8.5 9.5c.4 2.5 2.5 4.6 5 5l1.5-1.5-2-1-1 .7c-.8-.4-1.6-1.2-2-2l.7-1-1-2z"/></svg>
              WhatsApp
            </button>
            <button onClick={() => { onClose(); onOpenLead(current) }} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Ver detalles
            </button>
          </div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
          <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: '#fff', fontSize: 12, fontWeight: 600, cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}>← Anterior</button>
          <div style={{ display: 'flex', gap: 4 }}>
            {leads.map((_, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === idx ? 'var(--danger)' : 'var(--border)' }} />
            ))}
          </div>
          <button onClick={() => setIdx(i => Math.min(leads.length - 1, i + 1))} disabled={idx === leads.length - 1} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: '#fff', fontSize: 12, fontWeight: 600, cursor: idx === leads.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === leads.length - 1 ? 0.4 : 1 }}>Siguiente →</button>
        </div>
      </div>
    </>
  )
}

export default function LeadsHub({ initialLeads, stages, agents }: {
  initialLeads: Lead[]
  stages: PipelineStage[]
  agents: Agent[]
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [opFilter, setOpFilter] = useState<string>('Todas')
  const [originFilter, setOriginFilter] = useState<string>('Todos')
  const [stageFilter, setStageFilter] = useState<string>('Todas')
  const [openLead, setOpenLead] = useState<Lead | null>(null)
  const [showNewLead, setShowNewLead] = useState(false)
  const [savedView, setSavedView] = useState<SavedView>(null)
  const [showReactivation, setShowReactivation] = useState(false)
  const [zoneProperties, setZoneProperties] = useState<Property[]>([])
  const [loadingZone, setLoadingZone] = useState(false)

  // Read URL param to activate a saved view on navigation from sidebar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const view = params.get('view')
    if (view === 'premium') setSavedView('premium')
    else if (view === 'atrasados') setSavedView('atrasados')
    else if (view === 'palermo') setSavedView('palermo')
  }, [])

  useEffect(() => {
    if (savedView !== 'palermo') { setZoneProperties([]); return }
    setLoadingZone(true)
    const supabase = createClient()
    supabase
      .from('properties')
      .select('*')
      .in('status', ['Disponible'])
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        const zoneProps = (data || []).filter((p: Property) =>
          p.neighborhood?.toLowerCase().includes('palermo') ||
          p.neighborhood?.toLowerCase().includes('recoleta')
        )
        setZoneProperties(zoneProps)
        setLoadingZone(false)
      })
  }, [savedView])

  const filtered = useMemo(() => {
    let base = leads

    // Apply saved view filter first
    if (savedView === 'premium') {
      base = base.filter(l => l.hot || (l.currency === 'USD' && (l.amount ?? 0) > 500000))
    } else if (savedView === 'atrasados') {
      base = base.filter(l => l.days_without_contact > 5)
    } else if (savedView === 'palermo') {
      base = base.filter(l =>
        l.property?.neighborhood?.toLowerCase().includes('palermo') ||
        l.property?.neighborhood?.toLowerCase().includes('recoleta')
      )
    }

    return base.filter(l =>
      (opFilter === 'Todas' || l.operation === opFilter) &&
      (originFilter === 'Todos' || l.origin === originFilter) &&
      (stageFilter === 'Todas' || l.stage?.key === stageFilter)
    )
  }, [leads, opFilter, originFilter, stageFilter, savedView])

  const stats = useMemo(() => ({
    active: leads.length,
    hot: leads.filter(l => l.hot).length,
    overdue: leads.filter(l => l.days_without_contact >= 5).length,
    noAction: leads.filter(l => l.days_without_contact >= 3).length,
  }), [leads])

  const overdueLeads = useMemo(() =>
    leads.filter(l => l.days_without_contact > 5).sort((a, b) => b.days_without_contact - a.days_without_contact),
    [leads]
  )

  const handleMoveStage = useCallback(async (lead: Lead) => {
    const idx = stages.findIndex(s => s.id === lead.stage_id)
    const next = stages[Math.min(idx + 1, stages.length - 1)]
    if (!next || next.id === lead.stage_id) return
    const supabase = createClient()
    await supabase.from('leads').update({ stage_id: next.id }).eq('id', lead.id)
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage_id: next.id, stage: next } : l))
    if (openLead?.id === lead.id) setOpenLead(prev => prev ? { ...prev, stage_id: next.id, stage: next } : null)
  }, [stages, openLead])

  const handleLeadUpdate = useCallback((updated: Lead) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))
    setOpenLead(updated)
  }, [])

  const handleLeadCreated = useCallback((lead: Lead) => {
    setLeads(prev => [lead, ...prev])
  }, [])

  const SAVED_VIEWS = [
    { key: 'premium' as const, label: 'Leads Premium', sub: 'Ticket > USD 500k', color: 'var(--gold)', bg: 'var(--gold-soft)', border: '#E2D4B5' },
    { key: 'atrasados' as const, label: 'Atrasados +5 días', sub: 'Sin contacto', color: 'var(--danger)', bg: '#FBE8E5', border: '#E9CDC9' },
    { key: 'palermo' as const, label: 'Palermo & Recoleta', sub: 'Por zona premium', color: 'var(--ink)', bg: 'var(--surface)', border: 'var(--border)' },
  ]

  return (
    <>
      <Topbar
        crumb="WORKSPACE · LEADS"
        title="Leads Hub"
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => exportCSV(filtered)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 13, border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12m0 0-4-4m4 4 4-4M5 20h14"/></svg>
              Exportar
            </button>
            <button onClick={() => setShowNewLead(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 13, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Nuevo Lead
            </button>
          </div>
        }
      />

      <div style={{ padding: '24px 32px 48px' }}>

        {/* ── Saved Views ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Vistas guardadas</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {SAVED_VIEWS.map(v => {
              const isActive = savedView === v.key
              return (
                <button key={v.key} onClick={() => setSavedView(isActive ? null : v.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                  borderRadius: 'var(--radius-lg)', border: `1px solid ${isActive ? v.border : 'var(--border)'}`,
                  background: isActive ? v.bg : '#fff', cursor: 'pointer',
                  transition: 'all .15s',
                  boxShadow: isActive ? `0 0 0 2px ${v.color}22` : 'none',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, flexShrink: 0 }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: isActive ? v.color : 'var(--ink)' }}>{v.label}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1 }}>{v.sub}</div>
                  </div>
                  {isActive && (
                    <div style={{ marginLeft: 4, width: 16, height: 16, borderRadius: '50%', background: v.color, display: 'grid', placeItems: 'center' }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m4 12 5 5L20 7"/></svg>
                    </div>
                  )}
                </button>
              )
            })}
            {savedView && (
              <button onClick={() => setSavedView(null)} style={{ padding: '10px 14px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>
                × Limpiar vista
              </button>
            )}
          </div>
        </div>

        {/* ── View-specific banners ── */}
        {savedView === 'premium' && (
          <div style={{ marginBottom: 16, padding: '14px 20px', borderRadius: 'var(--radius)', background: 'var(--gold-soft)', border: '1px solid #E2D4B5', display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#6E5630' }}>Vista Premium activa · {filtered.length} leads con ticket &gt; USD 500k</div>
              <div style={{ fontSize: 12, color: '#8E6840', marginTop: 2 }}>
                {filtered.filter(l => l.days_without_contact >= 2).length} leads sin contacto humano en las últimas 48hs
                {filtered.filter(l => l.days_without_contact >= 2).length > 0 && <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 999, background: 'var(--danger)', color: '#fff', fontSize: 10, fontWeight: 700 }}>ALERTA</span>}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: '#6E5630' }}>{filtered.filter(l => l.days_without_contact >= 2).length}</div>
              <div>sin contacto 48h</div>
            </div>
          </div>
        )}

        {savedView === 'atrasados' && (
          <div style={{ marginBottom: 16, padding: '14px 20px', borderRadius: 'var(--radius)', background: '#FBE8E5', border: '1px solid #E9CDC9', display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--danger)' }}>{filtered.length} leads sin contacto por más de 5 días</div>
              <div style={{ fontSize: 12, color: '#A0383A', marginTop: 2 }}>
                {filtered.filter(l => l.days_without_contact >= 10).length} con +10 días — recomendamos reasignar
              </div>
            </div>
            <button onClick={() => setShowReactivation(true)} style={{ padding: '9px 16px', borderRadius: 'var(--radius)', border: '1px solid #E9CDC9', background: 'var(--danger)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Iniciar secuencia de reactivación →
            </button>
          </div>
        )}

        {savedView === 'palermo' && (
          <div style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
            <div style={{ padding: '14px 20px', borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{filtered.length} leads interesados en Palermo o Recoleta</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                  {zoneProperties.length} propiedades disponibles en zona · Match automático activo
                </div>
              </div>
            </div>
            <div style={{ borderRadius: 'var(--radius)', background: '#fff', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Propiedades en zona</div>
              <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                {loadingZone ? (
                  <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'var(--ink-3)' }}>Cargando...</div>
                ) : zoneProperties.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'var(--ink-3)' }}>Sin propiedades disponibles</div>
                ) : zoneProperties.map(p => (
                  <div key={p.id} style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.neighborhood} · {p.type}</div>
                    </div>
                    {p.premium && <span style={{ padding: '1px 5px', fontSize: 9, fontWeight: 700, background: 'var(--gold-soft)', color: '#6E5630', border: '1px solid #E2D4B5', borderRadius: 999, flexShrink: 0 }}>PREMIUM</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 18 }}>
          <SummaryStat label="Leads activos"   value={stats.active}  sub="total en sistema" />
          <SummaryStat label="Nuevos hoy"      value={leads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length} sub="ingresados hoy" />
          <SummaryStat label="Sin acción 72hs" value={stats.noAction} sub="requieren follow-up" color="var(--gold)" />
          <SummaryStat label="Atrasados"       value={stats.overdue}  sub="sin contacto +5d"    color="var(--danger)" />
          <SummaryStat label="Premium / HOT"   value={stats.hot}      sub="ticket > USD 500k"   color="var(--gold)" />
        </div>

        {/* Filters + Table */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          {/* Filter bar */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-3)' }}><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>

            <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', fontWeight: 600 }}>Operación</span>
            {['Todas','Venta','Alquiler'].map(o => (
              <button key={o} onClick={() => setOpFilter(o)} style={{
                padding: '7px 11px', borderRadius: 8, border: '1px solid var(--border)',
                background: opFilter === o ? 'var(--ink)' : '#fff',
                color: opFilter === o ? '#fff' : 'var(--ink-2)',
                fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
              }}>{o}</button>
            ))}

            <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }} />

            <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', fontWeight: 600 }}>Origen</span>
            {['Todos', ...ORIGINS].map(o => (
              <button key={o} onClick={() => setOriginFilter(o)} style={{
                padding: '7px 11px', borderRadius: 8, border: '1px solid var(--border)',
                background: originFilter === o ? 'var(--ink)' : '#fff',
                color: originFilter === o ? '#fff' : 'var(--ink-2)',
                fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
              }}>{o}</button>
            ))}

            <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }} />

            <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', fontWeight: 600 }}>Etapa</span>
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{
              padding: '7px 24px 7px 11px', borderRadius: 8, border: '1px solid var(--border)',
              background: stageFilter !== 'Todas' ? 'var(--ink)' : '#fff',
              color: stageFilter !== 'Todas' ? '#fff' : 'var(--ink-2)',
              fontSize: 12.5, fontWeight: 500, cursor: 'pointer', appearance: 'none', fontFamily: 'inherit',
            }}>
              <option value="Todas">Todas las etapas</option>
              {stages.map(s => <option key={s.id} value={s.key}>{s.name}</option>)}
            </select>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              {savedView && <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink-3)', fontWeight: 600 }}>Vista activa</span>}
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{filtered.length} de {leads.length} leads</span>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  {['', 'Nombre', 'Teléfono', 'Origen', 'Propiedad de interés', 'Operación', 'Etapa', 'Agente', 'Fecha', ''].map((h, i) => (
                    <th key={i} style={{
                      textAlign: i >= 8 ? 'right' : 'left',
                      fontSize: 10.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'var(--ink-3)', padding: '12px 14px', borderBottom: '1px solid var(--border)',
                      background: '#fff', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => {
                  const isPremiumAlert = savedView === 'premium' && lead.days_without_contact >= 2
                  const isZoneMatch = savedView === 'palermo' && zoneProperties.some(p =>
                    p.neighborhood?.toLowerCase() === lead.property?.neighborhood?.toLowerCase()
                  )
                  return (
                    <tr key={lead.id} onClick={() => setOpenLead(lead)}
                      style={{ cursor: 'pointer', transition: 'background .1s', background: isPremiumAlert ? '#FBF8F1' : 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FBFAF7')}
                      onMouseLeave={e => (e.currentTarget.style.background = isPremiumAlert ? '#FBF8F1' : 'transparent')}
                    >
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', width: 30 }}
                        onClick={e => e.stopPropagation()}>
                        <input type="checkbox" />
                      </td>
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                            background: lead.hot ? 'var(--gold)' : 'transparent',
                            border: lead.hot ? '0' : '1px solid var(--border)',
                          }} />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              {lead.name}
                              {lead.hot && <span style={{ padding: '1px 6px', fontSize: 10, fontWeight: 600, background: 'var(--gold-soft)', color: '#6E5630', border: '1px solid #E2D4B5', borderRadius: 999 }}>HOT</span>}
                              {savedView === 'premium' && !lead.hot && (l => l.currency === 'USD' && (l.amount ?? 0) > 500000)(lead) && (
                                <span style={{ padding: '1px 6px', fontSize: 10, fontWeight: 700, background: 'var(--gold)', color: '#fff', borderRadius: 999 }}>VIP</span>
                              )}
                              {isPremiumAlert && <span style={{ padding: '1px 6px', fontSize: 10, fontWeight: 700, background: 'var(--danger)', color: '#fff', borderRadius: 999 }}>48H</span>}
                              {isZoneMatch && <span style={{ padding: '1px 6px', fontSize: 10, fontWeight: 600, background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--border)', borderRadius: 999 }}>MATCH</span>}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{lead.id.slice(0,8)}…</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums', fontSize: 13.5, color: 'var(--ink-2)' }}>{lead.phone}</td>
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                        {lead.origin && <SourceTag src={lead.origin} />}
                      </td>
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                        {lead.property && (
                          <>
                            <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: 13.5 }}>{lead.property.address}</div>
                            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{lead.property.neighborhood} · {lead.property.type}</div>
                          </>
                        )}
                      </td>
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                        {lead.operation && <OpTag op={lead.operation} />}
                      </td>
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                        <StageTag stage={lead.stage} />
                      </td>
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                        {lead.agent && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--surface-2)', color: 'var(--ink)', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600, border: '1px solid var(--border)' }}>
                              {lead.agent.initials}
                            </div>
                            <span style={{ fontSize: 13 }}>{lead.agent.name.split(' ')[0]}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {new Date(lead.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        {' · '}
                        <span style={{ color: lead.days_without_contact > 5 ? 'var(--danger)' : 'var(--ink-3)', fontWeight: lead.days_without_contact > 5 ? 700 : 400 }}>
                          {lead.days_without_contact}d
                        </span>
                      </td>
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <IconBtn title="WhatsApp" color="var(--success)"
                            onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/\D/g,'')}`, '_blank')}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 1 1-3.4-6.5L20 4l-1.5 3.6A8 8 0 0 1 20 12z"/><path d="M8.5 9.5c.4 2.5 2.5 4.6 5 5l1.5-1.5-2-1-1 .7c-.8-.4-1.6-1.2-2-2l.7-1-1-2z"/></svg>
                          </IconBtn>
                          <IconBtn title="Mover etapa" onClick={() => handleMoveStage(lead)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                          </IconBtn>
                          <IconBtn title="Más">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>
                          </IconBtn>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
                      No hay leads que coincidan con los filtros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {openLead && (
        <LeadDrawer
          lead={openLead}
          stages={stages}
          onClose={() => setOpenLead(null)}
          onMove={handleMoveStage}
          onUpdate={handleLeadUpdate}
        />
      )}

      {showNewLead && (
        <NewLeadModal
          stages={stages}
          agents={agents}
          onClose={() => setShowNewLead(false)}
          onCreated={handleLeadCreated}
        />
      )}

      {showReactivation && overdueLeads.length > 0 && (
        <ReactivationModal
          leads={overdueLeads}
          onClose={() => setShowReactivation(false)}
          onOpenLead={(l) => { setShowReactivation(false); setOpenLead(l) }}
        />
      )}
    </>
  )
}

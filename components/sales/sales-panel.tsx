'use client'
import { useState, useMemo } from 'react'
import Topbar from '@/components/ui/topbar'
import { Tag } from '@/components/ui/tags'
import LeadDrawer from '@/components/leads/lead-drawer'
import type { Lead, PipelineStage, Agent } from '@/lib/types'
import { fmtUSD } from '@/lib/format'

// ── helpers ─────────────────────────────────────────────────────────────────
function Avatar({ initials, size = 32, color = 'var(--gold-soft)' }: { initials: string; size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: 'var(--gold)', flexShrink: 0,
      fontFamily: 'var(--font-jakarta)',
    }}>
      {initials}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', ...style }}>
      {children}
    </div>
  )
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {children}
    </div>
  )
}

function IconBtn({ title, children, color, onClick }: { title: string; children: React.ReactNode; color?: string; onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 30, height: 30, display: 'grid', placeItems: 'center',
      border: '1px solid var(--border)', borderRadius: 6,
      background: '#fff', color: color || 'var(--ink-2)', cursor: 'pointer',
    }}>{children}</button>
  )
}

// ── hardcoded tasks ──────────────────────────────────────────────────────────
const TASKS = [
  { id: 1, name: 'Florencia Bianchi', action: 'Llamar por revisita', time: '09:00', overdue: true, phone: '+5491112345678' },
  { id: 2, name: 'Ramiro Achával', action: 'Enviar propuesta actualizada', time: '11:00', overdue: false, phone: '+5491187654321' },
  { id: 3, name: 'Damián Ortega', action: 'Confirmar turno escritura', time: '14:30', overdue: false, phone: '+5491156781234' },
  { id: 4, name: 'Martín Iraola', action: 'Seguimiento oferta pendiente', time: '16:00', overdue: true, phone: '+5491143217654' },
]

const EFFECTIVENESS = [
  { name: 'Lucía Fernández', initials: 'LF', pct: 22, respMin: 3 },
  { name: 'Martín Suárez', initials: 'MS', pct: 19, respMin: 5 },
  { name: 'Valentina Ríos', initials: 'VR', pct: 16, respMin: 8 },
  { name: 'Santiago Gómez', initials: 'SG', pct: 12, respMin: 12 },
  { name: 'Andrea Torres', initials: 'AT', pct: 9, respMin: 18 },
]

const STAGE_AVG_DAYS: Record<string, number> = {
  consulta: 4, visita: 7, oferta: 12, reserva: 9, escritura: 18,
}

// ── overdue modal ─────────────────────────────────────────────────────────────
function OverdueModal({ leads, onClose, onOpenLead }: { leads: Lead[]; onClose: () => void; onOpenLead: (l: Lead) => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(36,25,17,0.4)', backdropFilter: 'blur(3px)', zIndex: 60 }} />
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 440,
        background: '#fff', borderLeft: '1px solid var(--border)', zIndex: 70,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 0 40px rgba(36,25,17,.16)',
        animation: 'slideIn .22s cubic-bezier(.2,.7,.2,1)',
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(20px); opacity:0 } to { transform:none; opacity:1 } }`}</style>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--danger)' }}>ATRASADOS · CONTACTAR YA</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-jakarta)', marginTop: 3 }}>{leads.length} leads sin contacto</h2>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {leads.sort((a, b) => b.days_without_contact - a.days_without_contact).map(lead => (
            <div key={lead.id} style={{ padding: '14px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--danger-soft)', display: 'grid', placeItems: 'center', flexShrink: 0, border: '1px solid #E9CDC9' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--danger)' }}>{lead.name.slice(0,2).toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{lead.name}</span>
                  {lead.hot && <Tag variant="gold">HOT</Tag>}
                  {lead.days_without_contact >= 10 && <span style={{ padding: '1px 6px', fontSize: 10, fontWeight: 700, background: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B', borderRadius: 999 }}>+10d</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lead.property?.address || 'Sin propiedad'} · {lead.stage?.name}
                </div>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)', minWidth: 28 }}>
                  {lead.days_without_contact}d
                </span>
                <IconBtn title="WhatsApp" color="var(--success)" onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/\D/g,'')}`, '_blank')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </IconBtn>
                <IconBtn title="Ver detalles" onClick={() => { onClose(); onOpenLead(lead) }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </IconBtn>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}

// ── calendar view ─────────────────────────────────────────────────────────────
function CalendarView({ leads, stages, onOpenLead }: { leads: Lead[]; stages: PipelineStage[]; onOpenLead: (l: Lead) => void }) {
  const [offset, setOffset] = useState(0)
  const today = new Date()
  const viewDate = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const lastDay = new Date(year, month + 1, 0)
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
  const todayStr = today.toISOString().slice(0, 10)

  const days: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))

  const leadsByDate = useMemo(() => {
    const map: Record<string, Lead[]> = {}
    for (const lead of leads) {
      if (!lead.next_action_date) continue
      const key = lead.next_action_date.slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(lead)
    }
    return map
  }, [leads])

  const monthName = viewDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Calendar header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)', textTransform: 'capitalize' }}>{monthName}</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            {Object.values(leadsByDate).flat().length} acciones programadas
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setOffset(o => o - 1)} style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff', cursor: 'pointer', color: 'var(--ink-2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button onClick={() => setOffset(0)} style={{ padding: '0 10px', height: 30, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>Hoy</button>
            <button onClick={() => setOffset(o => o + 1)} style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff', cursor: 'pointer', color: 'var(--ink-2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', padding: '4px 0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} style={{ minHeight: 90 }} />
            const dateStr = day.toISOString().slice(0, 10)
            const dayLeads = leadsByDate[dateStr] || []
            const isToday = dateStr === todayStr
            const isPast = dateStr < todayStr

            return (
              <div key={dateStr} style={{
                minHeight: 90, border: `1.5px solid ${isToday ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', padding: '6px 7px',
                background: isToday ? 'var(--gold-soft)' : isPast && dayLeads.length > 0 ? '#FBF8F5' : '#fff',
              }}>
                <div style={{
                  fontSize: 12, fontWeight: isToday ? 800 : 500,
                  color: isToday ? 'var(--gold)' : isPast ? 'var(--ink-4)' : 'var(--ink)',
                  marginBottom: 4,
                }}>{day.getDate()}</div>
                {dayLeads.slice(0, 3).map(lead => {
                  const overdue = isPast && lead.stage?.key !== 'escritura'
                  const isHot = lead.hot
                  return (
                    <div
                      key={lead.id}
                      onClick={() => onOpenLead(lead)}
                      title={`${lead.name} · ${lead.stage?.name}`}
                      style={{
                        padding: '3px 6px', borderRadius: 4, marginBottom: 3,
                        background: overdue ? '#FBE8E5' : isHot ? 'var(--gold-soft)' : 'var(--surface)',
                        border: `1px solid ${overdue ? '#E9CDC9' : isHot ? '#E2D4B5' : 'var(--border)'}`,
                        fontSize: 10.5, fontWeight: 500,
                        color: overdue ? 'var(--danger)' : isHot ? '#6E5630' : 'var(--ink-2)',
                        cursor: 'pointer',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {overdue && '⚠ '}{lead.name.split(' ')[0]}
                    </div>
                  )
                })}
                {dayLeads.length > 3 && (
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, paddingTop: 2 }}>+{dayLeads.length - 3} más</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 11, color: 'var(--ink-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#FBE8E5', border: '1px solid #E9CDC9' }} />
            Atrasado
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--gold-soft)', border: '1px solid #E2D4B5' }} />
            Premium / HOT
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--surface)', border: '1px solid var(--border)' }} />
            Acción programada
          </div>
        </div>
      </div>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────
export default function SalesPanel({ leads, stages, agents }: {
  leads: Lead[]
  stages: PipelineStage[]
  agents: Agent[]
}) {
  const [activeTab, setActiveTab] = useState<'panel' | 'calendario'>('panel')
  const [showOverdue, setShowOverdue] = useState(false)
  const [openLead, setOpenLead] = useState<Lead | null>(null)

  const totalLeads = leads.length
  const overdue = useMemo(() => leads.filter(l => l.days_without_contact >= 5), [leads])
  const sin72 = useMemo(() => leads.filter(l => l.days_without_contact >= 3 && l.stage?.key !== 'escritura'), [leads])
  const closedLeads = useMemo(() => leads.filter(l => l.stage?.key === 'escritura'), [leads])
  const atRiskUSD = useMemo(() => overdue.reduce((s, l) => s + (l.amount || 0), 0), [overdue])

  const stageCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of stages) map[s.key] = 0
    for (const l of leads) {
      if (l.stage?.key) map[l.stage.key] = (map[l.stage.key] || 0) + 1
    }
    return map
  }, [leads, stages])

  const bottleneckKey = useMemo(() => {
    let maxScore = 0; let key = ''
    for (const s of stages) {
      const score = (stageCounts[s.key] || 0) * (STAGE_AVG_DAYS[s.key] || 1)
      if (score > maxScore) { maxScore = score; key = s.key }
    }
    return key
  }, [stages, stageCounts])

  const topOverdue = useMemo(() => overdue.slice(0, 5), [overdue])
  const firstStageCount = stages[0] ? (stageCounts[stages[0].key] || 0) : 1
  const maxBarCount = Math.max(...stages.map(s => stageCounts[s.key] || 0), 1)

  function handleLeadUpdate(updated: Lead) {
    setOpenLead(updated)
  }

  const tabBar = (
    <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
      {([
        { key: 'panel', label: 'Panel' },
        { key: 'calendario', label: 'Calendario' },
      ] as const).map(tab => (
        <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
          padding: '7px 16px', borderRadius: 7, border: 0, cursor: 'pointer',
          fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 13,
          background: activeTab === tab.key ? '#fff' : 'transparent',
          color: activeTab === tab.key ? 'var(--ink)' : 'var(--ink-3)',
          boxShadow: activeTab === tab.key ? '0 1px 4px rgba(36,25,17,.1)' : 'none',
          transition: 'all .12s',
        }}>{tab.label}</button>
      ))}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="Panel de Ventas" crumb="CRM" right={tabBar} />

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', flex: 1 }}>

        {/* ── Red Alert Banner ── */}
        {overdue.length > 0 && (
          <div style={{
            background: 'linear-gradient(90deg, #FBE8E5 0%, var(--surface) 100%)',
            borderLeft: '3px solid var(--danger)', borderRadius: 'var(--radius)',
            padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 20,
            border: '1px solid #E9CDC9',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--danger)', fontFamily: 'var(--font-jakarta)' }}>Atención requerida</div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 3 }}>
                <strong>{overdue.length}</strong> leads sin contacto ≥5 días &nbsp;·&nbsp;
                <strong>2</strong> tareas vencidas &nbsp;·&nbsp;
                <strong>{fmtUSD(atRiskUSD)}</strong> en riesgo
              </div>
            </div>
            <button onClick={() => setShowOverdue(true)} style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid #E9CDC9',
              background: '#fff', color: 'var(--danger)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              Ver todos
            </button>
          </div>
        )}

        {/* ── 5 KPI cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Leads Activos</div>
            <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 30, marginTop: 8 }}>{totalLeads}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: 'var(--ink-3)' }}>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>▲ +12%</span><span>vs. semana pasada</span>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Por Etapa</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, marginTop: 12, height: 40 }}>
              {stages.map(s => {
                const count = stageCounts[s.key] || 0
                const h = maxBarCount > 0 ? Math.max(4, (count / maxBarCount) * 38) : 4
                const isBottleneck = s.key === bottleneckKey
                return (
                  <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: '100%', height: h, background: isBottleneck ? 'var(--danger)' : 'var(--gold)', borderRadius: 3, opacity: isBottleneck ? 1 : 0.6 }} />
                    <span style={{ fontSize: 9, color: 'var(--ink-3)' }}>{count}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
              Cuello: <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{stages.find(s => s.key === bottleneckKey)?.name || '—'}</span>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>⚠ Atrasados</div>
            <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 30, marginTop: 8, color: overdue.length > 0 ? 'var(--danger)' : 'var(--ink)' }}>{overdue.length}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>Sin contacto ≥5 días</div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Sin Acción 72hs</div>
            <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 30, marginTop: 8, color: sin72.length > 0 ? '#7A4A1F' : 'var(--ink)' }}>{sin72.length}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>Excluye escritura</div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Cierres mes</div>
            <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 30, marginTop: 8, color: 'var(--success)' }}>{closedLeads.length}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>En etapa escritura</div>
          </div>
        </div>

        {/* ── Tab content ── */}
        {activeTab === 'calendario' ? (
          <CalendarView leads={leads} stages={stages} onOpenLead={setOpenLead} />
        ) : (
          <>
            {/* ── Row 2: Tareas + Efectividad ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
              <Card>
                <CardHeader>
                  <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Tareas de hoy</h3>
                  <Tag variant="default">{TASKS.length}</Tag>
                </CardHeader>
                <div>
                  {TASKS.map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                      <input type="checkbox" style={{ width: 16, height: 16, accentColor: 'var(--gold)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{task.name}</span>
                          {task.overdue && <Tag variant="danger">Vencida</Tag>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{task.action}</div>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--ink-4)', flexShrink: 0 }}>{task.time}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <IconBtn title="WhatsApp" color="var(--success)" onClick={() => window.open(`https://wa.me/${task.phone.replace(/\D/g,'')}`, '_blank')}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </IconBtn>
                        <IconBtn title="Llamar">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        </IconBtn>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Efectividad del equipo</h3>
                </CardHeader>
                <div style={{ padding: '8px 0' }}>
                  {EFFECTIVENESS.map(agent => {
                    const respColor = agent.respMin <= 5 ? 'var(--success)' : agent.respMin <= 15 ? 'var(--ink-2)' : 'var(--danger)'
                    return (
                      <div key={agent.name} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar initials={agent.initials} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{agent.name}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{agent.pct}%</span>
                          </div>
                          <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(agent.pct / 25) * 100}%`, background: 'var(--gold)', borderRadius: 2 }} />
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: respColor, fontWeight: 600, flexShrink: 0, minWidth: 48, textAlign: 'right' }}>
                          {agent.respMin} min
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>

            {/* ── Row 3: Funnel + Atrasados ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
              <Card>
                <CardHeader>
                  <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Embudo · días promedio por etapa</h3>
                </CardHeader>
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 60px 70px 70px', padding: '8px 20px', fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
                    <span>Etapa</span><span>Distribución</span>
                    <span style={{ textAlign: 'right' }}>Leads</span>
                    <span style={{ textAlign: 'right' }}>Conv %</span>
                    <span style={{ textAlign: 'right' }}>Días prom</span>
                  </div>
                  {stages.map((s, i) => {
                    const count = stageCounts[s.key] || 0
                    const convPct = firstStageCount > 0 ? Math.round((count / firstStageCount) * 100) : 0
                    const avgDays = STAGE_AVG_DAYS[s.key] || 5
                    const barW = maxBarCount > 0 ? Math.max(4, (count / maxBarCount) * 100) : 4
                    const isBottleneck = s.key === bottleneckKey
                    return (
                      <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 60px 70px 70px', padding: '11px 20px', alignItems: 'center', borderBottom: i < stages.length - 1 ? '1px solid var(--border)' : undefined, background: isBottleneck ? 'var(--danger-soft)' : 'transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isBottleneck && <span style={{ fontSize: 10 }}>⚠</span>}
                          <span style={{ fontSize: 13, fontWeight: isBottleneck ? 700 : 500, color: isBottleneck ? 'var(--danger)' : 'var(--ink)' }}>{s.name}</span>
                        </div>
                        <div style={{ paddingRight: 12 }}>
                          <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${barW}%`, background: isBottleneck ? 'var(--danger)' : 'var(--gold)', borderRadius: 3, opacity: isBottleneck ? 1 : 0.7 }} />
                          </div>
                        </div>
                        <div className="num" style={{ textAlign: 'right', fontWeight: 600, fontSize: 13 }}>{count}</div>
                        <div className="num" style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-3)' }}>{convPct}%</div>
                        <div className="num" style={{ textAlign: 'right', fontWeight: 600, fontSize: 13, color: isBottleneck ? 'var(--danger)' : 'var(--ink)' }}>{avgDays}d</div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Atrasados · contactar YA</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag variant="danger">{overdue.length}</Tag>
                    {overdue.length > 5 && (
                      <button onClick={() => setShowOverdue(true)} style={{ fontSize: 11, fontWeight: 600, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Ver todos →</button>
                    )}
                  </div>
                </CardHeader>
                <div style={{ padding: '8px 0' }}>
                  {topOverdue.length === 0 ? (
                    <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No hay leads atrasados</div>
                  ) : topOverdue.map(lead => (
                    <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setOpenLead(lead)}>
                      <Avatar initials={lead.agent?.initials || lead.agent?.name?.slice(0, 2).toUpperCase() || '?'} size={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</span>
                          {lead.hot && <Tag variant="danger">HOT</Tag>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lead.property?.address || 'Sin propiedad'}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="num" style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)' }}>{lead.days_without_contact}d</span>
                        <IconBtn title="WhatsApp" color="var(--success)" onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${lead.phone?.replace(/\D/g,'')}`, '_blank') }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </IconBtn>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

      </div>

      {showOverdue && (
        <OverdueModal
          leads={overdue}
          onClose={() => setShowOverdue(false)}
          onOpenLead={setOpenLead}
        />
      )}

      {openLead && (
        <LeadDrawer
          lead={openLead}
          stages={stages}
          onClose={() => setOpenLead(null)}
          onMove={async () => {}}
          onUpdate={handleLeadUpdate}
        />
      )}
    </div>
  )
}

'use client'
import { useState, useMemo, useEffect } from 'react'
import Topbar from '@/components/ui/topbar'
import { Tag } from '@/components/ui/tags'
import LeadDrawer from '@/components/leads/lead-drawer'
import { createClient } from '@/lib/supabase/client'
import type { Lead, PipelineStage, Agent } from '@/lib/types'
import { fmtUSD } from '@/lib/format'

// ── icon helpers ──────────────────────────────────────────────────────────────
function WaIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
}
function PhoneIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>
}
function CheckIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
}

function Avatar({ initials, size = 32, color = 'var(--gold-soft)' }: { initials: string; size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: 'var(--gold)', flexShrink: 0,
      fontFamily: 'var(--font-jakarta)',
    }}>{initials}</div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', ...style }}>{children}</div>
}
function CardHeader({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>{children}</div>
}
function IconBtn({ title, children, color, onClick }: { title: string; children: React.ReactNode; color?: string; onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 32, height: 32, display: 'grid', placeItems: 'center',
      border: '1px solid var(--border)', borderRadius: 6, background: '#fff', color: color || 'var(--ink-2)', cursor: 'pointer',
    }}>{children}</button>
  )
}

// ⚠ Estimación fija: el "días promedio por etapa" real necesita historial de
// transiciones que hoy no se registra. Queda marcado para definir.
const STAGE_AVG_DAYS: Record<string, number> = { consulta: 4, visita: 7, oferta: 12, reserva: 9, escritura: 18 }

const waLink = (phone?: string | null) => `https://wa.me/${(phone || '').replace(/\D/g, '')}`

// ── overdue modal (lo usa el Admin para "ver todos") ───────────────────────────
function OverdueModal({ leads, onClose, onOpenLead }: { leads: Lead[]; onClose: () => void; onOpenLead: (l: Lead) => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(36,25,17,0.4)', backdropFilter: 'blur(3px)', zIndex: 60 }} />
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 440,
        background: '#fff', borderLeft: '1px solid var(--border)', zIndex: 70,
        display: 'flex', flexDirection: 'column', boxShadow: '0 0 40px rgba(36,25,17,.16)',
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
          {[...leads].sort((a, b) => b.days_without_contact - a.days_without_contact).map(lead => (
            <div key={lead.id} style={{ padding: '14px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--danger-soft)', display: 'grid', placeItems: 'center', flexShrink: 0, border: '1px solid #E9CDC9' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--danger)' }}>{lead.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{lead.name}</span>
                  {lead.hot && <Tag variant="gold">HOT</Tag>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lead.property?.address || 'Sin propiedad'} · {lead.stage?.name}
                </div>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)', minWidth: 28 }}>{lead.days_without_contact}d</span>
                <IconBtn title="WhatsApp" color="var(--success)" onClick={() => window.open(waLink(lead.phone), '_blank')}><WaIcon size={13} /></IconBtn>
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

// ── calendar view (ambos roles) ───────────────────────────────────────────────
function CalendarView({ leads, onOpenLead }: { leads: Lead[]; onOpenLead: (l: Lead) => void }) {
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
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)', textTransform: 'capitalize' }}>{monthName}</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{Object.values(leadsByDate).flat().length} acciones programadas</span>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', padding: '4px 0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{d}</div>
          ))}
        </div>
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
                <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 500, color: isToday ? 'var(--gold)' : isPast ? 'var(--ink-4)' : 'var(--ink)', marginBottom: 4 }}>{day.getDate()}</div>
                {dayLeads.slice(0, 3).map(lead => {
                  const overdue = isPast && lead.stage?.key !== 'escritura'
                  return (
                    <div key={lead.id} onClick={() => onOpenLead(lead)} title={`${lead.name} · ${lead.stage?.name}`} style={{
                      padding: '3px 6px', borderRadius: 4, marginBottom: 3,
                      background: overdue ? '#FBE8E5' : lead.hot ? 'var(--gold-soft)' : 'var(--surface)',
                      border: `1px solid ${overdue ? '#E9CDC9' : lead.hot ? '#E2D4B5' : 'var(--border)'}`,
                      fontSize: 10.5, fontWeight: 500, color: overdue ? 'var(--danger)' : lead.hot ? '#6E5630' : 'var(--ink-2)',
                      cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{overdue && '⚠ '}{lead.name.split(' ')[0]}</div>
                  )
                })}
                {dayLeads.length > 3 && <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, paddingTop: 2 }}>+{dayLeads.length - 3} más</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── KPI mini-card ──────────────────────────────────────────────────────────────
function Kpi({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>{label}</div>
      <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 30, marginTop: 8, color: color || 'var(--ink)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>{sub}</div>}
    </div>
  )
}

// ── main ───────────────────────────────────────────────────────────────────────
export default function SalesPanel({ leads: initialLeads, stages, agents, isAdmin = false }: {
  leads: Lead[]
  stages: PipelineStage[]
  agents: Agent[]
  isAdmin?: boolean
}) {
  const [activeTab, setActiveTab] = useState<'panel' | 'calendario'>('panel')
  const [showOverdue, setShowOverdue] = useState(false)
  const [openLead, setOpenLead] = useState<Lead | null>(null)
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [contactBusyId, setContactBusyId] = useState<string | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  useEffect(() => { setLeads(initialLeads) }, [initialLeads])

  const totalLeads = leads.length
  const todayStr = new Date().toISOString().slice(0, 10)
  const overdue = useMemo(() => leads.filter(l => l.days_without_contact >= 5), [leads])
  const closedLeads = useMemo(() => leads.filter(l => l.stage?.key === 'escritura'), [leads])
  const atRiskUSD = useMemo(() => overdue.reduce((s, l) => s + (l.amount || 0), 0), [overdue])

  const todayTasks = useMemo(
    () => leads.filter(l => l.next_action_date && l.next_action_date.slice(0, 10) === todayStr),
    [leads, todayStr]
  )
  const overdueTasks = useMemo(
    () => leads.filter(l => l.next_action_date && l.next_action_date.slice(0, 10) < todayStr && l.stage?.key !== 'escritura'),
    [leads, todayStr]
  )

  // Cierres del mes (por closed_at real; fallback updated_at)
  const closedThisMonth = useMemo(() => {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    return closedLeads.filter(l => new Date(l.closed_at ?? l.updated_at) >= monthStart)
  }, [closedLeads])
  const conversionGlobal = totalLeads > 0 ? Math.round((closedLeads.length / totalLeads) * 100) : 0

  const stageCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of stages) map[s.key] = 0
    for (const l of leads) if (l.stage?.key) map[l.stage.key] = (map[l.stage.key] || 0) + 1
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
  const firstStageCount = stages[0] ? (stageCounts[stages[0].key] || 0) : 1
  const maxBarCount = Math.max(...stages.map(s => stageCounts[s.key] || 0), 1)

  // Efectividad / ranking real por agente
  const agentRanking = useMemo(() => {
    return agents.map(a => {
      const assigned = leads.filter(l => (l.owner_id ?? l.agent_id) === a.id)
      const closed = assigned.filter(l => l.stage?.key === 'escritura')
      const over = assigned.filter(l => l.days_without_contact >= 5)
      const pct = assigned.length ? Math.round((closed.length / assigned.length) * 100) : 0
      return { id: a.id, name: a.name, initials: a.initials || a.name.slice(0, 2).toUpperCase(), assigned: assigned.length, closed: closed.length, over: over.length, pct }
    }).filter(a => a.assigned > 0).sort((x, y) => y.pct - x.pct || y.closed - x.closed)
  }, [agents, leads])

  // Lista accionable del agente: atrasados + tareas de hoy (sin duplicar)
  const actionItems = useMemo(() => {
    const map = new Map<string, Lead>()
    for (const l of overdue) map.set(l.id, l)
    for (const l of todayTasks) if (!map.has(l.id)) map.set(l.id, l)
    return Array.from(map.values()).sort((a, b) => b.days_without_contact - a.days_without_contact)
  }, [overdue, todayTasks])

  function handleLeadUpdate(updated: Lead) {
    setOpenLead(updated)
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))
  }

  // Marcar contacto inline (mismo efecto que el botón del drawer)
  async function markContacted(lead: Lead, e?: React.MouseEvent) {
    e?.stopPropagation()
    if (contactBusyId) return
    setContactBusyId(lead.id)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: agent } = user ? await supabase.from('agents').select('id').eq('auth_user_id', user.id).single() : { data: null }
    const base = { lead_id: lead.id, agent_id: agent?.id ?? null, description: 'Contacto registrado con el cliente.' }
    const { error } = await supabase.from('activities').insert({ ...base, type: 'Contacto' })
    if (error) await supabase.from('activities').insert({ ...base, type: 'Nota' })
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, days_without_contact: 0, last_contact_at: new Date().toISOString() } : l))
    setContactBusyId(null)
  }

  const tabBar = (
    <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
      {([{ key: 'panel', label: 'Panel' }, { key: 'calendario', label: 'Calendario' }] as const).map(tab => (
        <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
          padding: '7px 16px', borderRadius: 7, border: 0, cursor: 'pointer',
          fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 13,
          background: activeTab === tab.key ? '#fff' : 'transparent',
          color: activeTab === tab.key ? 'var(--ink)' : 'var(--ink-3)',
          boxShadow: activeTab === tab.key ? '0 1px 4px rgba(36,25,17,.1)' : 'none', transition: 'all .12s',
        }}>{tab.label}</button>
      ))}
    </div>
  )

  // ── Embudo (compartido: bloque del cockpit y del análisis del agente) ──
  const funnelCard = (
    <Card>
      <CardHeader>
        <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Embudo de ventas</h3>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>cuello de botella resaltado</span>
      </CardHeader>
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 60px 70px', padding: '8px 20px', fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
          <span>Etapa</span><span>Distribución</span>
          <span style={{ textAlign: 'right' }}>Leads</span>
          <span style={{ textAlign: 'right' }}>Conv %</span>
        </div>
        {stages.map((s, i) => {
          const count = stageCounts[s.key] || 0
          const convPct = firstStageCount > 0 ? Math.round((count / firstStageCount) * 100) : 0
          const barW = maxBarCount > 0 ? Math.max(4, (count / maxBarCount) * 100) : 4
          const isBottleneck = s.key === bottleneckKey
          return (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 60px 70px', padding: '11px 20px', alignItems: 'center', borderBottom: i < stages.length - 1 ? '1px solid var(--border)' : undefined, background: isBottleneck ? 'var(--danger-soft)' : 'transparent', boxShadow: isBottleneck ? 'inset 3px 0 0 var(--danger)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: isBottleneck ? 700 : 500, color: isBottleneck ? 'var(--danger)' : 'var(--ink)' }}>{s.name}</span>
                {isBottleneck && <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff', background: 'var(--danger)', borderRadius: 999, padding: '1px 6px' }}>Cuello</span>}
              </div>
              <div style={{ paddingRight: 12 }}>
                <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${barW}%`, background: isBottleneck ? 'var(--danger)' : 'var(--gold)', borderRadius: 3, opacity: isBottleneck ? 1 : 0.5 }} />
                </div>
              </div>
              <div className="num" style={{ textAlign: 'right', fontWeight: 600, fontSize: 13, color: isBottleneck ? 'var(--danger)' : 'var(--ink)' }}>{count}</div>
              <div className="num" style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: isBottleneck ? 'var(--danger)' : 'var(--ink-3)' }}>{convPct}%</div>
            </div>
          )
        })}
      </div>
    </Card>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="Panel de Ventas" crumb="CRM" search={false} right={tabBar} />

      <div className="page-pad" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', flex: 1 }}>

        {activeTab === 'calendario' ? (
          <CalendarView leads={leads} onOpenLead={setOpenLead} />
        ) : isAdmin ? (
          /* ════════ COCKPIT DEL DUEÑO (Admin) ════════ */
          <>
            {/* Salud del equipo */}
            <div className="stat-grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              <Kpi label="Cierres del mes" value={closedThisMonth.length} sub="escrituras este mes" color="var(--success)" />
              <Kpi label="Conversión global" value={`${conversionGlobal}%`} sub="leads → escritura" />
              <Kpi label="Pipeline en riesgo" value={fmtUSD(atRiskUSD)} sub={`${overdue.length} leads atrasados`} color={atRiskUSD > 0 ? 'var(--danger)' : 'var(--ink)'} />
              <Kpi label="Leads activos" value={totalLeads} sub={`${todayTasks.length} tareas hoy`} />
            </div>

            {/* Ranking del equipo */}
            <Card>
              <CardHeader>
                <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Ranking del equipo</h3>
                {overdue.length > 0 && (
                  <button onClick={() => setShowOverdue(true)} style={{ fontSize: 11, fontWeight: 600, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Ver atrasados →</button>
                )}
              </CardHeader>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px', padding: '8px 20px', fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
                  <span>Agente</span>
                  <span style={{ textAlign: 'right' }}>Leads</span>
                  <span style={{ textAlign: 'right' }}>Conv %</span>
                  <span style={{ textAlign: 'right' }}>Atrasados</span>
                </div>
                {agentRanking.length === 0 ? (
                  <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Sin leads asignados todavía</div>
                ) : agentRanking.map((a, i) => (
                  <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px', padding: '11px 20px', alignItems: 'center', borderBottom: i < agentRanking.length - 1 ? '1px solid var(--border)' : undefined }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar initials={a.initials} size={30} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</span>
                    </div>
                    <div className="num" style={{ textAlign: 'right', fontSize: 13, color: 'var(--ink-2)' }}>{a.assigned}</div>
                    <div className="num" style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>{a.pct}%</div>
                    <div className="num" style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: a.over > 0 ? 'var(--danger)' : 'var(--ink-3)' }}>{a.over}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Embudo */}
            {funnelCard}

            <p style={{ fontSize: 12, color: 'var(--ink-4)', textAlign: 'center', margin: 0 }}>
              Las tareas individuales del día están en la pestaña <strong>Calendario</strong>.
            </p>
          </>
        ) : (
          /* ════════ MI DÍA (Agente) ════════ */
          <>
            {/* Línea de acción */}
            <div style={{
              background: actionItems.length > 0 ? 'linear-gradient(90deg, #FBE8E5 0%, var(--surface) 100%)' : 'var(--success-soft)',
              borderLeft: `3px solid ${actionItems.length > 0 ? 'var(--danger)' : 'var(--success)'}`,
              borderRadius: 'var(--radius)', padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 20,
              border: `1px solid ${actionItems.length > 0 ? '#E9CDC9' : 'var(--success-soft)'}`,
            }}>
              <div style={{ flex: 1 }}>
                {actionItems.length > 0 ? (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-jakarta)', color: 'var(--ink)' }}>
                      Tenés {overdue.length} {overdue.length === 1 ? 'atrasado' : 'atrasados'} y {todayTasks.length} {todayTasks.length === 1 ? 'tarea' : 'tareas'} para hoy
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3 }}>Empezá por el más urgente y registrá cada contacto.</div>
                  </>
                ) : (
                  <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-jakarta)', color: 'var(--success)' }}>¡Estás al día! No tenés pendientes 🎉</div>
                )}
              </div>
              {actionItems.length > 0 && (
                <button onClick={() => setOpenLead(actionItems[0])} style={{
                  padding: '10px 20px', borderRadius: 'var(--radius)', border: 'none',
                  background: 'var(--ink)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>Empezar →</button>
              )}
            </div>

            {/* Lista accionable */}
            <Card>
              <CardHeader>
                <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Para hacer hoy</h3>
                <Tag variant="default">{actionItems.length}</Tag>
              </CardHeader>
              <div>
                {actionItems.length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Nada pendiente. Buen momento para sumar leads nuevos.</div>
                ) : actionItems.map(lead => {
                  const isOver = lead.days_without_contact >= 5
                  const taskTime = lead.next_action_date?.includes('T') ? lead.next_action_date.slice(11, 16) : null
                  return (
                    <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setOpenLead(lead)}>
                      <Avatar initials={lead.name.slice(0, 2).toUpperCase()} size={34} color={isOver ? 'var(--danger-soft)' : 'var(--gold-soft)'} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{lead.name}</span>
                          {lead.hot && <Tag variant="gold">HOT</Tag>}
                          {isOver
                            ? <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)' }}>{lead.days_without_contact}d sin contacto</span>
                            : taskTime && <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>· hoy {taskTime}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lead.stage?.name || 'Sin etapa'}{lead.property?.address ? ` · ${lead.property.address}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <IconBtn title="WhatsApp" color="var(--success)" onClick={() => window.open(waLink(lead.phone), '_blank')}><WaIcon /></IconBtn>
                        <IconBtn title="Llamar" onClick={() => lead.phone && window.open(`tel:${lead.phone.replace(/\D/g, '')}`)}><PhoneIcon /></IconBtn>
                        <button
                          title="Marcar como contactado"
                          onClick={(e) => markContacted(lead, e)}
                          disabled={contactBusyId === lead.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 32, borderRadius: 6,
                            border: '1px solid var(--border)', background: 'var(--ink)', color: '#fff', fontSize: 12, fontWeight: 600,
                            cursor: contactBusyId === lead.id ? 'wait' : 'pointer', whiteSpace: 'nowrap',
                          }}>
                          <CheckIcon size={13} /> Hecho
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Análisis colapsable */}
            <div>
              <button onClick={() => setShowAnalysis(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 16px',
                background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', fontFamily: 'var(--font-jakarta)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showAnalysis ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}><path d="M9 18l6-6-6-6"/></svg>
                Ver análisis (embudo y conversión del equipo)
              </button>
              {showAnalysis && <div style={{ marginTop: 16 }}>{funnelCard}</div>}
            </div>
          </>
        )}

      </div>

      {showOverdue && (
        <OverdueModal leads={overdue} onClose={() => setShowOverdue(false)} onOpenLead={setOpenLead} />
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

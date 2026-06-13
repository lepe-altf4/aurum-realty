'use client'
import { useState, useMemo, useEffect } from 'react'
import Topbar from '@/components/ui/topbar'
import { Tag } from '@/components/ui/tags'
import LeadDrawer from '@/components/leads/lead-drawer'
import { createClient } from '@/lib/supabase/client'
import type { Lead, PipelineStage } from '@/lib/types'
import { compactNum } from '@/lib/format'

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

const waLink = (phone?: string | null) => `https://wa.me/${(phone || '').replace(/\D/g, '')}`
const usdOf = (l: Lead, rate: number) => l.amount ? (l.currency === 'USD' ? l.amount : l.amount / rate) : 0

// ── calendar view ──────────────────────────────────────────────────────────────
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

// ── chip de resumen (Atrasados / Hoy / Semana) ──────────────────────────────────
function StatChip({ label, value, tone }: { label: string; value: number; tone: 'danger' | 'gold' | 'ink' }) {
  const color = tone === 'danger' ? 'var(--danger)' : tone === 'gold' ? 'var(--gold)' : 'var(--ink)'
  const bg = tone === 'danger' ? 'var(--danger-soft)' : tone === 'gold' ? 'var(--gold-soft)' : 'var(--surface)'
  const border = tone === 'danger' ? '#E9CDC9' : tone === 'gold' ? '#E2D4B5' : 'var(--border)'
  return (
    <div style={{ flex: 1, background: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius-lg)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <span className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 800, fontSize: 28, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)' }}>{label}</span>
    </div>
  )
}

// ── main ───────────────────────────────────────────────────────────────────────
export default function SalesPanel({ leads: initialLeads, stages, dollarRate = 1200 }: {
  leads: Lead[]
  stages: PipelineStage[]
  dollarRate?: number
}) {
  const [activeTab, setActiveTab] = useState<'panel' | 'calendario'>('panel')
  const [openLead, setOpenLead] = useState<Lead | null>(null)
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [contactBusyId, setContactBusyId] = useState<string | null>(null)
  useEffect(() => { setLeads(initialLeads) }, [initialLeads])

  const todayStr = new Date().toISOString().slice(0, 10)
  const in7Str = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10)
  }, [])

  const overdue = useMemo(() => leads.filter(l => l.days_without_contact >= 5), [leads])
  const todayTasks = useMemo(
    () => leads.filter(l => l.next_action_date && l.next_action_date.slice(0, 10) === todayStr),
    [leads, todayStr]
  )

  // Próximas acciones: cualquier next_action_date entre mañana y +7 días (todos los tipos).
  const upcoming = useMemo(
    () => leads
      .filter(l => {
        if (!l.next_action_date || l.stage?.key === 'escritura') return false
        const d = l.next_action_date.slice(0, 10)
        return d > todayStr && d <= in7Str
      })
      .sort((a, b) => (a.next_action_date! < b.next_action_date! ? -1 : 1)),
    [leads, todayStr, in7Str]
  )

  // Lista accionable: atrasados + tareas de hoy, sin duplicar, por urgencia.
  const actionItems = useMemo(() => {
    const map = new Map<string, Lead>()
    for (const l of overdue) map.set(l.id, l)
    for (const l of todayTasks) if (!map.has(l.id)) map.set(l.id, l)
    return Array.from(map.values()).sort((a, b) => b.days_without_contact - a.days_without_contact)
  }, [overdue, todayTasks])

  // Mi pipeline por etapa: cantidad + valor USD propio.
  const myPipeline = useMemo(() => stages.map(s => {
    const stl = leads.filter(l => l.stage?.key === s.key)
    const usd = stl.reduce((sum, l) => sum + usdOf(l, dollarRate), 0)
    return { key: s.key, name: s.name, count: stl.length, usd }
  }), [stages, leads, dollarRate])
  const pipelineTotalUSD = useMemo(() => myPipeline.reduce((s, p) => s + p.usd, 0), [myPipeline])

  function handleLeadUpdate(updated: Lead) {
    setOpenLead(updated)
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))
  }

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="Panel de Ventas" crumb="CRM" search={false} right={tabBar} />

      <div className="page-pad" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', flex: 1 }}>

        {activeTab === 'calendario' ? (
          <CalendarView leads={leads} onOpenLead={setOpenLead} />
        ) : (
          <>
            {/* ── Arriba: 3 chips de resumen ── */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <StatChip label="Atrasados (+5 días)" value={overdue.length} tone="danger" />
              <StatChip label="Tareas para hoy" value={todayTasks.length} tone="gold" />
              <StatChip label="Próximos 7 días" value={upcoming.length} tone="ink" />
            </div>

            {/* ── Centro: tareas de hoy/vencidas (izq) + próximas acciones (der) ── */}
            <div className="grid-2col-resp" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>

              {/* Izquierda — Para hacer hoy */}
              <Card>
                <CardHeader>
                  <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Para hacer hoy</h3>
                  <Tag variant="default">{actionItems.length}</Tag>
                </CardHeader>
                <div>
                  {actionItems.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                      ¡Estás al día! No tenés atrasados ni tareas para hoy.
                    </div>
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

              {/* Derecha — Próximos 7 días */}
              <Card>
                <CardHeader>
                  <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Próximos 7 días</h3>
                  <Tag variant="default">{upcoming.length}</Tag>
                </CardHeader>
                <div>
                  {upcoming.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                      No tenés acciones agendadas para esta semana.
                    </div>
                  ) : upcoming.map((lead, i) => {
                    const d = new Date(lead.next_action_date!)
                    const dayLabel = d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })
                    const time = lead.next_action_date!.includes('T') ? lead.next_action_date!.slice(11, 16) : null
                    return (
                      <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: i < upcoming.length - 1 ? '1px solid var(--border)' : undefined, cursor: 'pointer' }} onClick={() => setOpenLead(lead)}>
                        <div style={{ width: 44, flexShrink: 0, textAlign: 'center' }}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--gold)', textTransform: 'capitalize' }}>{dayLabel}</div>
                          {time && <div className="num" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{time}</div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</span>
                            {lead.hot && <Tag variant="gold">HOT</Tag>}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lead.stage?.name || 'Sin etapa'}{lead.property?.address ? ` · ${lead.property.address}` : ''}
                          </div>
                        </div>
                        <IconBtn title="WhatsApp" color="var(--success)" onClick={(e) => { e.stopPropagation(); window.open(waLink(lead.phone), '_blank') }}><WaIcon /></IconBtn>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>

            {/* ── Abajo: mi pipeline por etapa (chips compactos con $ propio) ── */}
            <Card>
              <CardHeader>
                <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Mi pipeline</h3>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {leads.length} {leads.length === 1 ? 'lead' : 'leads'} · USD {compactNum(pipelineTotalUSD)}
                </span>
              </CardHeader>
              <div style={{ padding: '16px 20px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {myPipeline.map(p => (
                  <div key={p.key} style={{
                    flex: '1 1 140px', minWidth: 130, background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '12px 14px',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                      <span className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 22, color: 'var(--ink)' }}>{p.count}</span>
                      <span className="num" style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)' }}>USD {compactNum(p.usd)}</span>
                    </div>
                  </div>
                ))}
                {myPipeline.length === 0 && (
                  <div style={{ padding: '8px 0', color: 'var(--ink-3)', fontSize: 13 }}>Todavía no tenés leads asignados.</div>
                )}
              </div>
            </Card>
          </>
        )}

      </div>

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

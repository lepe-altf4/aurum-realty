'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Topbar from '@/components/ui/topbar'
import { Tag } from '@/components/ui/tags'
import { timeAgo } from '@/lib/format'
import type { Organization, Agent, PipelineStage } from '@/lib/types'

// ── helpers ─────────────────────────────────────────────────────────────────
function Avatar({ initials, size = 32 }: { initials: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: 'var(--gold)', flexShrink: 0,
      fontFamily: 'var(--font-jakarta)',
    }}>
      {initials}
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', letterSpacing: '0.02em' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)',
  fontSize: 13, fontFamily: 'inherit', color: 'var(--ink)', background: '#fff',
  outline: 'none', width: '100%',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer',
}

// ── Tab: Organización ─────────────────────────────────────────────────────────
function OrgTab({ org }: { org: Organization | null }) {
  const [form, setForm] = useState({
    name: org?.name ?? '',
    cuit: org?.cuit ?? '',
    address: org?.address ?? '',
    dollar_rate: org?.dollar_rate?.toString() ?? '1200',
  })
  const [rateSource, setRateSource] = useState<'auto' | 'manual'>(org?.dollar_rate_source ?? 'manual')
  const [rateUpdatedAt, setRateUpdatedAt] = useState<string | null>(org?.dollar_rate_updated_at ?? null)
  const [refreshing, setRefreshing] = useState(false)
  const [rateError, setRateError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  async function handleRefreshNow() {
    setRefreshing(true)
    setRateError(null)
    try {
      const res = await fetch('/api/dollar/refresh', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setRateError(data.error ?? `Error ${res.status}`)
      } else {
        setForm(f => ({ ...f, dollar_rate: String(data.dollar_rate) }))
        setRateUpdatedAt(data.dollar_rate_updated_at ?? new Date().toISOString())
        setRateSource('auto')
      }
    } catch (e) {
      setRateError((e as Error).message)
    }
    setRefreshing(false)
  }

  async function handleSave() {
    if (!org) return
    setSaving(true)
    setRateError(null)
    const base = {
      name: form.name,
      cuit: form.cuit,
      address: form.address,
      dollar_rate: parseFloat(form.dollar_rate) || 1200,
    }
    const meta = {
      dollar_rate_source: rateSource,
      dollar_rate_updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('organization').update({ ...base, ...meta }).eq('id', org.id)
    if (error && /dollar_rate_source|dollar_rate_updated_at|schema cache/i.test(error.message)) {
      // Migración sin correr: guardar sin metadata
      await supabase.from('organization').update(base).eq('id', org.id)
    } else if (!error) {
      setRateUpdatedAt(meta.dollar_rate_updated_at)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormField label="Nombre de la organización">
          <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </FormField>
        <FormField label="CUIT">
          <input style={inputStyle} value={form.cuit} onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))} placeholder="XX-XXXXXXXX-X" />
        </FormField>
      </div>
      <FormField label="Dirección">
        <input style={inputStyle} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Av. Corrientes 1234, CABA" />
      </FormField>
      <FormField label="Cotización dólar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Modo: automático (dólar blue) o manual */}
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', width: 'fit-content' }}>
            {([['auto', 'Automático · blue'], ['manual', 'Manual']] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setRateSource(key)}
                style={{
                  padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 0,
                  background: rateSource === key ? 'var(--ink)' : '#fff',
                  color: rateSource === key ? '#fff' : 'var(--ink-3)',
                  transition: 'background 0.2s',
                }}
              >{label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: rateSource === 'auto' ? 'var(--surface)' : '#fff', flex: 1, minWidth: 180 }}>
              <span style={{ padding: '9px 12px', background: 'var(--surface)', borderRight: '1px solid var(--border)', fontSize: 13, color: 'var(--ink-3)', fontWeight: 600 }}>ARS</span>
              <input
                type="number"
                readOnly={rateSource === 'auto'}
                style={{ ...inputStyle, border: 0, borderRadius: 0, flex: 1, background: 'transparent', color: rateSource === 'auto' ? 'var(--ink-3)' : 'var(--ink)' }}
                value={form.dollar_rate}
                onChange={e => setForm(f => ({ ...f, dollar_rate: e.target.value }))}
              />
            </div>
            {rateSource === 'auto' && (
              <button
                type="button"
                onClick={handleRefreshNow}
                disabled={refreshing}
                style={{
                  padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)',
                  background: '#fff', color: 'var(--ink)', fontSize: 12.5, fontWeight: 600,
                  cursor: refreshing ? 'wait' : 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {refreshing ? 'Consultando…' : '↻ Actualizar ahora'}
              </button>
            )}
          </div>

          <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
            {rateSource === 'auto'
              ? <>Se actualiza solo con el dólar blue de dolarapi.com (cron diario + al abrir el dashboard si pasaron +6hs).{rateUpdatedAt && <> · Actualizado <strong>{timeAgo(rateUpdatedAt)}</strong></>}</>
              : <>Valor fijo cargado a mano. El cron no lo pisa hasta que vuelvas a “Automático”.{rateUpdatedAt && <> · Último cambio <strong>{timeAgo(rateUpdatedAt)}</strong></>}</>}
          </div>
          {rateError && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: '#FBEAEA', border: '1px solid #E5B4B4', color: 'var(--danger)', fontSize: 12 }}>{rateError}</div>
          )}
        </div>
      </FormField>
      <div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 0,
            background: saved ? 'var(--success)' : 'var(--ink)', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
          }}
        >
          {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

// ── Tab: Equipo ────────────────────────────────────────────────────────────────
function TeamTab({ agents }: { agents: Agent[] }) {
  const [list, setList] = useState<Agent[]>(agents)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [invite, setInvite] = useState({ email: '', name: '', role: 'Agente' })
  const [inviting, setInviting] = useState(false)
  const [inviteOk, setInviteOk] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  function handleRoleChange(id: string, role: Agent['role']) {
    setList(l => l.map(a => a.id === id ? { ...a, role } : a))
  }

  function handleCommChange(id: string, v: string) {
    setList(l => l.map(a => a.id === id ? { ...a, commission_pct: parseFloat(v) || 0 } : a))
  }

  function handleDeactivate(id: string) {
    setList(l => l.map(a => a.id === id ? { ...a, status: a.status === 'Activo' ? 'Inactivo' : 'Activo' } : a))
  }

  async function handleInvite() {
    const name = invite.name.trim()
    const email = invite.email.trim().toLowerCase()
    if (!name || !email) {
      setInviteError('Nombre y email son obligatorios.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError('Email inválido.')
      return
    }
    setInviting(true)
    setInviteError(null)
    let payload: { agent?: Agent; error?: string }
    try {
      const res = await fetch('/api/agents/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role: invite.role }),
      })
      payload = await res.json()
      if (!res.ok) {
        setInviting(false)
        setInviteError(payload.error ?? `Error ${res.status}`)
        return
      }
    } catch (e) {
      setInviting(false)
      setInviteError(`No se pudo enviar la invitación: ${(e as Error).message}`)
      return
    }
    setInviting(false)
    if (payload.agent) {
      setList(l => {
        const existing = l.findIndex(a => a.id === payload.agent!.id)
        const next = existing >= 0
          ? l.map((a, i) => (i === existing ? payload.agent! : a))
          : [...l, payload.agent!]
        return next.sort((a, b) => a.name.localeCompare(b.name))
      })
    }
    setInvite({ email: '', name: '', role: 'Agente' })
    setInviteOk(true)
    setTimeout(() => {
      setInviteOk(false)
      setInviteOpen(false)
    }, 1800)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setInviteOpen(o => !o)} style={{
          padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'var(--ink)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          + Invitar agente
        </button>
      </div>

      {inviteOpen && (
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 20,
          border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end',
          }}>
            <FormField label="Nombre">
              <input style={inputStyle} value={invite.name} onChange={e => setInvite(i => ({ ...i, name: e.target.value }))} placeholder="Ana García" />
            </FormField>
            <FormField label="Email">
              <input style={inputStyle} type="email" value={invite.email} onChange={e => setInvite(i => ({ ...i, email: e.target.value }))} placeholder="ana@inmobiliaria.com" />
            </FormField>
            <FormField label="Rol">
              <select style={selectStyle} value={invite.role} onChange={e => setInvite(i => ({ ...i, role: e.target.value }))}>
                <option>Admin</option>
                <option>Senior</option>
                <option>Agente</option>
                <option>Junior</option>
              </select>
            </FormField>
            <button
              onClick={handleInvite}
              disabled={inviting || inviteOk}
              style={{
                padding: '9px 18px', borderRadius: 8, border: 0,
                background: inviteOk ? 'var(--success)' : 'var(--gold)', color: '#fff',
                fontSize: 13, fontWeight: 600,
                cursor: inviting ? 'wait' : inviteOk ? 'default' : 'pointer',
                opacity: inviting ? 0.7 : 1, transition: 'background 0.2s',
              }}
            >
              {inviting ? 'Enviando…' : inviteOk ? '✓ Invitación enviada' : 'Enviar invitación'}
            </button>
          </div>
          {inviteError && (
            <div style={{
              padding: '8px 12px', borderRadius: 8, background: '#FBEAEA',
              border: '1px solid #E5B4B4', color: 'var(--danger)', fontSize: 12,
            }}>{inviteError}</div>
          )}
        </div>
      )}

      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#fff' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 160px 120px 80px 90px 100px',
          padding: '10px 20px', fontSize: 11, color: 'var(--ink-3)',
          fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          borderBottom: '1px solid var(--border)', background: 'var(--surface)',
        }}>
          <span>Agente</span>
          <span>Email</span>
          <span>Rol</span>
          <span style={{ textAlign: 'right' }}>Com %</span>
          <span style={{ textAlign: 'center' }}>Estado</span>
          <span style={{ textAlign: 'right' }}>Acciones</span>
        </div>
        {list.map((agent, i) => (
          <div key={agent.id} style={{
            display: 'grid', gridTemplateColumns: '1fr 160px 120px 80px 90px 100px',
            padding: '12px 20px', alignItems: 'center',
            borderBottom: i < list.length - 1 ? '1px solid var(--border)' : undefined,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={agent.initials || agent.name.slice(0, 2).toUpperCase()} size={32} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{agent.name}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {agent.email}
            </div>
            <div>
              {editId === agent.id ? (
                <select
                  style={{ ...selectStyle, fontSize: 12, padding: '5px 8px' }}
                  value={agent.role}
                  onChange={e => handleRoleChange(agent.id, e.target.value as Agent['role'])}
                >
                  <option>Admin</option>
                  <option>Senior</option>
                  <option>Agente</option>
                  <option>Junior</option>
                </select>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{agent.role}</span>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              {editId === agent.id ? (
                <input
                  type="number"
                  style={{ ...inputStyle, width: 56, textAlign: 'right', padding: '5px 8px', fontSize: 12 }}
                  value={agent.commission_pct}
                  onChange={e => handleCommChange(agent.id, e.target.value)}
                />
              ) : (
                <span className="num" style={{ fontSize: 13, fontWeight: 600 }}>{agent.commission_pct}%</span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Tag
                variant={
                  agent.status === 'Activo' ? 'success' :
                  agent.status === 'Pendiente' ? 'gold' :
                  'default'
                }
                dot
              >
                {agent.status}
              </Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button onClick={() => setEditId(editId === agent.id ? null : agent.id)} style={{
                padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)',
                background: editId === agent.id ? 'var(--ink)' : '#fff',
                color: editId === agent.id ? '#fff' : 'var(--ink-2)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>
                {editId === agent.id ? 'Listo' : 'Editar'}
              </button>
              <button
                onClick={() => handleDeactivate(agent.id)}
                disabled={agent.status === 'Pendiente'}
                title={agent.status === 'Pendiente' ? 'Esperando que el agente acepte la invitación' : undefined}
                style={{
                  padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)',
                  background: '#fff',
                  color: agent.status === 'Pendiente' ? 'var(--ink-3)'
                    : agent.status === 'Activo' ? 'var(--danger)' : 'var(--success)',
                  fontSize: 11, fontWeight: 600,
                  cursor: agent.status === 'Pendiente' ? 'not-allowed' : 'pointer',
                  opacity: agent.status === 'Pendiente' ? 0.5 : 1,
                }}
              >
                {agent.status === 'Activo' ? 'Desactivar' : agent.status === 'Pendiente' ? 'Pendiente' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab: Pipeline ─────────────────────────────────────────────────────────────
function PipelineTab({ stages }: { stages: PipelineStage[] }) {
  const [list, setList] = useState(stages)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const supabase = createClient()

  function startEdit(s: PipelineStage) {
    setEditId(s.id)
    setEditName(s.name)
    setErrorMsg(null)
  }

  async function saveEdit(id: string) {
    const trimmed = editName.trim()
    if (!trimmed) {
      setErrorMsg('El nombre no puede estar vacío.')
      return
    }
    setSavingId(id)
    setErrorMsg(null)
    const { error } = await supabase
      .from('pipeline_stages')
      .update({ name: trimmed })
      .eq('id', id)
    setSavingId(null)
    if (error) {
      setErrorMsg(`No se pudo guardar: ${error.message}`)
      return
    }
    setList(l => l.map(s => s.id === id ? { ...s, name: trimmed } : s))
    setEditId(null)
    setSavedId(id)
    setTimeout(() => setSavedId(prev => prev === id ? null : prev), 1800)
  }

  return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 4 }}>
        Etapas del embudo de ventas ordenadas por posición.
      </div>
      {errorMsg && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, background: '#FBEAEA',
          border: '1px solid #E5B4B4', color: 'var(--danger)', fontSize: 12,
        }}>{errorMsg}</div>
      )}
      {list.map((s, i) => (
        <div key={s.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', background: '#fff',
          border: '1px solid var(--border)', borderRadius: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', flexShrink: 0,
          }}>
            {i + 1}
          </div>
          <div style={{ flex: 1 }}>
            {editId === s.id ? (
              <input
                style={{ ...inputStyle, fontSize: 13 }}
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveEdit(s.id)}
                autoFocus
              />
            ) : (
              <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
            )}
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>key: {s.key}</div>
          </div>
          <div>
            {editId === s.id ? (
              <button
                onClick={() => saveEdit(s.id)}
                disabled={savingId === s.id}
                style={{
                  padding: '5px 12px', borderRadius: 6, border: 0,
                  background: 'var(--ink)', color: '#fff', fontSize: 12, fontWeight: 600,
                  cursor: savingId === s.id ? 'wait' : 'pointer', opacity: savingId === s.id ? 0.7 : 1,
                }}
              >
                {savingId === s.id ? 'Guardando…' : 'Guardar'}
              </button>
            ) : (
              <button onClick={() => startEdit(s)} style={{
                padding: '5px 12px', borderRadius: 6,
                border: savedId === s.id ? '1px solid var(--success)' : '1px solid var(--border)',
                background: savedId === s.id ? 'var(--success)' : '#fff',
                color: savedId === s.id ? '#fff' : 'var(--ink-2)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {savedId === s.id ? '✓ Guardado' : 'Editar'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Integraciones ────────────────────────────────────────────────────────
type Integration = {
  key: string
  name: string
  description: string
  enabled: boolean
  comingSoon?: boolean
  icon: string
}

const DEFAULT_INTEGRATIONS: Integration[] = [
  { key: 'whatsapp', name: 'WhatsApp Business', description: 'Recibí y enviá mensajes directamente desde el CRM', enabled: true, icon: 'WA' },
  { key: 'zonaprop', name: 'ZonaProp', description: 'Publicá tus propiedades en el portal', enabled: false, comingSoon: true, icon: 'ZP' },
  { key: 'argenprop', name: 'Argenprop', description: 'Publicá tus propiedades en el portal', enabled: false, comingSoon: true, icon: 'AP' },
  { key: 'instagram', name: 'Instagram', description: 'Capturá leads de formularios de Instagram Lead Ads', enabled: false, comingSoon: true, icon: 'IG' },
]



function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<Integration[]>(DEFAULT_INTEGRATIONS)

  function toggle(key: string) {
    const int = integrations.find(i => i.key === key)
    if (!int || int.comingSoon) return
    setIntegrations(l => l.map(i => i.key === key ? { ...i, enabled: !i.enabled } : i))
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
        {integrations.map(int => (
          <div key={int.key} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '16px 20px', background: '#fff',
            border: '1px solid var(--border)', borderRadius: 12,
            opacity: int.comingSoon ? 0.7 : 1,
          }}>
            {/* icon placeholder */}
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', flexShrink: 0,
            }}>
              {int.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{int.name}</div>
                {int.comingSoon && (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: 'var(--gold-soft)', color: '#6E5630', border: '1px solid #E2D4B5', letterSpacing: '0.06em' }}>PRÓXIMAMENTE</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{int.description}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Tag variant={int.enabled ? 'success' : int.comingSoon ? 'gold' : 'default'} dot>
                {int.enabled ? 'Activo' : int.comingSoon ? 'Próximamente' : 'Inactivo'}
              </Tag>
              {/* Toggle switch */}
              <button
                onClick={() => toggle(int.key)}
                disabled={int.comingSoon}
                title={int.comingSoon ? 'Integración en desarrollo' : undefined}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 0,
                  cursor: int.comingSoon ? 'not-allowed' : 'pointer',
                  background: int.enabled ? 'var(--success)' : 'var(--border-strong)',
                  position: 'relative', transition: 'background 0.25s', flexShrink: 0,
                  padding: 0, opacity: int.comingSoon ? 0.5 : 1,
                }}
              >
                <span style={{
                  position: 'absolute', top: 2, left: int.enabled ? 22 : 2,
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.25s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ── main component ────────────────────────────────────────────────────────────
const TABS = [
  { key: 'org', label: 'Organización' },
  { key: 'team', label: 'Equipo' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'integrations', label: 'Integraciones' },
]

export default function AdminSettings({ org, agents, stages }: {
  org: Organization | null
  agents: Agent[]
  stages: PipelineStage[]
}) {
  const [activeTab, setActiveTab] = useState('org')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="Configuración" crumb="CRM" search={false} />

      {/* Tab nav */}
      <div className="tab-nav" style={{ padding: '0 32px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '14px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: 0, background: 'transparent',
              color: activeTab === tab.key ? 'var(--ink)' : 'var(--ink-3)',
              borderBottom: activeTab === tab.key ? '2px solid var(--gold)' : '2px solid transparent',
              transition: 'color 0.15s',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="page-pad" style={{ padding: 32, overflowY: 'auto', flex: 1 }}>
        {activeTab === 'org' && <OrgTab org={org} />}
        {activeTab === 'team' && <TeamTab agents={agents} />}
        {activeTab === 'pipeline' && <PipelineTab stages={stages} />}
        {activeTab === 'integrations' && <IntegrationsTab />}
      </div>
    </div>
  )
}

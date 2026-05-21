'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Topbar from '@/components/ui/topbar'
import { Tag } from '@/components/ui/tags'
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
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  async function handleSave() {
    if (!org) return
    setSaving(true)
    await supabase.from('organization').update({
      name: form.name,
      cuit: form.cuit,
      address: form.address,
      dollar_rate: parseFloat(form.dollar_rate) || 1200,
    }).eq('id', org.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormField label="Nombre de la organización">
          <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value.slice(0, 200) }))} maxLength={200} />
        </FormField>
        <FormField label="CUIT">
          <input style={inputStyle} value={form.cuit} onChange={e => setForm(f => ({ ...f, cuit: e.target.value.replace(/[^\d\-]/g, '').slice(0, 20) }))} maxLength={20} placeholder="XX-XXXXXXXX-X" />
        </FormField>
      </div>
      <FormField label="Dirección">
        <input style={inputStyle} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value.slice(0, 300) }))} maxLength={300} placeholder="Av. Corrientes 1234, CABA" />
      </FormField>
      <FormField label="Cotización dólar">
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
          <span style={{ padding: '9px 12px', background: 'var(--surface)', borderRight: '1px solid var(--border)', fontSize: 13, color: 'var(--ink-3)', fontWeight: 600 }}>ARS</span>
          <input
            type="number"
            style={{ ...inputStyle, border: 0, borderRadius: 0, flex: 1 }}
            value={form.dollar_rate}
            onChange={e => setForm(f => ({ ...f, dollar_rate: e.target.value }))}
          />
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
          border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end',
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
          <button style={{
            padding: '9px 18px', borderRadius: 8, border: 0,
            background: 'var(--gold)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            Enviar invitación
          </button>
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
              <Tag variant={agent.status === 'Activo' ? 'success' : 'default'} dot>
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
              <button onClick={() => handleDeactivate(agent.id)} style={{
                padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)',
                background: '#fff', color: agent.status === 'Activo' ? 'var(--danger)' : 'var(--success)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>
                {agent.status === 'Activo' ? 'Desactivar' : 'Activar'}
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

  function startEdit(s: PipelineStage) {
    setEditId(s.id)
    setEditName(s.name)
  }

  function saveEdit(id: string) {
    setList(l => l.map(s => s.id === id ? { ...s, name: editName } : s))
    setEditId(null)
  }

  return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 4 }}>
        Etapas del embudo de ventas ordenadas por posición.
      </div>
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
              <button onClick={() => saveEdit(s.id)} style={{
                padding: '5px 12px', borderRadius: 6, border: 0,
                background: 'var(--ink)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Guardar</button>
            ) : (
              <button onClick={() => startEdit(s)} style={{
                padding: '5px 12px', borderRadius: 6,
                border: '1px solid var(--border)', background: '#fff',
                color: 'var(--ink-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Editar</button>
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
  icon: string
}

const DEFAULT_INTEGRATIONS: Integration[] = [
  { key: 'whatsapp', name: 'WhatsApp Business', description: 'Recibí y enviá mensajes directamente desde el CRM', enabled: true, icon: 'WA' },
  { key: 'zonaprop', name: 'ZonaProp', description: 'Importá leads automáticamente desde ZonaProp', enabled: true, icon: 'ZP' },
  { key: 'argenprop', name: 'Argenprop', description: 'Importá leads automáticamente desde Argenprop', enabled: false, icon: 'AP' },
  { key: 'instagram', name: 'Instagram', description: 'Capturá leads de formularios de Instagram Lead Ads', enabled: true, icon: 'IG' },
]

function ArgenpropModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(36,25,17,0.4)', backdropFilter: 'blur(2px)', zIndex: 80 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(36,25,17,.22)', zIndex: 90, overflow: 'hidden' }}>
        <div style={{ padding: '28px 28px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #E2D4B5' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Próximamente</h2>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6, marginBottom: 20 }}>
            La integración con <strong>Argenprop</strong> está en desarrollo y estará disponible muy pronto.
            Podrás importar leads automáticamente desde tus publicaciones.
          </p>
          <div style={{ padding: '12px 16px', background: 'var(--gold-soft)', borderRadius: 'var(--radius)', border: '1px solid #E2D4B5', fontSize: 12, color: '#6E5630', marginBottom: 20 }}>
            ✦ Estamos trabajando en esta integración con el equipo de Argenprop. Te notificaremos cuando esté lista.
          </div>
          <button onClick={onClose} style={{ width: '100%', padding: '11px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--ink)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Entendido
          </button>
        </div>
      </div>
    </>
  )
}

function InstagramModal({ onClose }: { onClose: () => void }) {
  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/instagram`
    : 'https://your-domain.com/api/webhooks/instagram'
  const [copied, setCopied] = useState(false)

  function copyUrl() {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(36,25,17,0.4)', backdropFilter: 'blur(2px)', zIndex: 80 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(36,25,17,.22)', zIndex: 90, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>INTEGRACIÓN</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>Configurar Instagram Lead Ads</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            Para capturar leads de tus formularios de Instagram Lead Ads, configurá el webhook en el panel de Meta for Business:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { num: 1, text: 'Accedé a Meta Business Suite → Configuración → Páginas → Webhooks' },
              { num: 2, text: 'Hacé clic en "Agregar webhook" y seleccioná el evento "leadgen"' },
              { num: 3, text: 'Pegá la URL del webhook (abajo) y el token de verificación: aurum-crm-2025' },
              { num: 4, text: 'Verificá y activá el webhook. Los nuevos leads llegarán automáticamente.' },
            ].map(step => (
              <div key={step.num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--ink)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{step.num}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, paddingTop: 2 }}>{step.text}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>URL del Webhook</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {webhookUrl}
              </div>
              <button onClick={copyUrl} style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)', background: copied ? 'var(--success)' : '#fff', color: copied ? '#fff' : 'var(--ink)', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'background .2s' }}>
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '11px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--ink)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Listo, entendido
          </button>
        </div>
      </div>
    </>
  )
}

function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<Integration[]>(DEFAULT_INTEGRATIONS)
  const [showArgenprop, setShowArgenprop] = useState(false)
  const [showInstagram, setShowInstagram] = useState(false)

  function toggle(key: string) {
    if (key === 'argenprop') {
      setShowArgenprop(true)
      return
    }
    if (key === 'instagram') {
      const int = integrations.find(i => i.key === 'instagram')
      if (!int?.enabled) {
        setShowInstagram(true)
      }
      setIntegrations(l => l.map(i => i.key === key ? { ...i, enabled: !i.enabled } : i))
      return
    }
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{int.name}</div>
                {int.key === 'argenprop' && (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: 'var(--gold-soft)', color: '#6E5630', border: '1px solid #E2D4B5', letterSpacing: '0.06em' }}>PRÓXIMAMENTE</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{int.description}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Tag variant={int.enabled ? 'success' : 'default'} dot>
                {int.enabled ? 'Activo' : 'Inactivo'}
              </Tag>
              {/* Toggle switch */}
              <button
                onClick={() => toggle(int.key)}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 0, cursor: 'pointer',
                  background: int.enabled ? 'var(--success)' : 'var(--border-strong)',
                  position: 'relative', transition: 'background 0.25s', flexShrink: 0,
                  padding: 0,
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

      {showArgenprop && <ArgenpropModal onClose={() => setShowArgenprop(false)} />}
      {showInstagram && <InstagramModal onClose={() => setShowInstagram(false)} />}
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
      <div style={{ padding: '0 32px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 0 }}>
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
      <div style={{ padding: 32, overflowY: 'auto', flex: 1 }}>
        {activeTab === 'org' && <OrgTab org={org} />}
        {activeTab === 'team' && <TeamTab agents={agents} />}
        {activeTab === 'pipeline' && <PipelineTab stages={stages} />}
        {activeTab === 'integrations' && <IntegrationsTab />}
      </div>
    </div>
  )
}

'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { fmtPrice } from '@/lib/format'
import type { Lead } from '@/lib/types'

export default function LeadCard({ lead, isDragging = false }: { lead: Lead; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  const price = lead.property ? fmtPrice(
    lead.property.currency_listing === 'USD' ? (lead.property.price_usd ?? 0) : (lead.property.price_ars ?? 0),
    lead.property.currency_listing,
    lead.property.operation
  ) : null

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
    >
      <div style={{
        background: '#fff',
        border: `1px solid ${isDragging ? 'var(--border-strong)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: 12,
        cursor: 'grab',
        boxShadow: isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transition: 'box-shadow .12s, border-color .12s',
        userSelect: 'none',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{lead.id.slice(0, 8).toUpperCase()}</span>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {lead.property?.currency_listing && (
              <span style={{
                padding: '1px 5px', borderRadius: 3, fontWeight: 700, fontSize: 9, letterSpacing: '0.08em',
                background: lead.property.currency_listing === 'USD' ? 'var(--ink)' : 'var(--gold)',
                color: lead.property.currency_listing === 'USD' ? '#fff' : 'var(--ink)',
              }}>{lead.property.currency_listing}</span>
            )}
            {lead.property?.premium && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />}
            {lead.days_without_contact > 5 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} />}
          </div>
        </div>

        <h5 style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 13.5, marginBottom: 4, color: 'var(--ink)' }}>{lead.name}</h5>
        {lead.property && (
          <>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.4 }}>{lead.property.address}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              {lead.property.neighborhood} · {lead.property.type}
              {lead.operation && <> · <span style={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{lead.operation}</span></>}
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
          {price && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{price}</span>}
          {lead.agent && (
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--surface-2)', color: 'var(--ink)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 600, border: '1px solid var(--border)' }}>
              {lead.agent.initials}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {new Date(lead.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
          </span>
          <span style={{ fontSize: 11, color: lead.days_without_contact === 0 ? 'var(--success)' : lead.days_without_contact > 5 ? 'var(--danger)' : 'var(--ink-3)' }}>
            {lead.days_without_contact === 0 ? 'Hoy' : `${lead.days_without_contact}d sin contacto`}
          </span>
        </div>
      </div>
    </div>
  )
}

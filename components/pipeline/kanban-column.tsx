'use client'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import LeadCard from '@/components/pipeline/lead-card'
import { compactNum } from '@/lib/format'
import type { Lead, PipelineStage } from '@/lib/types'

function ColumnTotals({ leads }: { leads: Lead[] }) {
  const usd = leads.filter(l => l.currency === 'USD').reduce((s, l) => s + (l.amount ?? 0), 0)
  const ars = leads.filter(l => l.currency === 'ARS').reduce((s, l) => s + (l.amount ?? 0), 0)
  const parts: string[] = []
  if (usd > 0) parts.push(`USD ${compactNum(usd)}`)
  if (ars > 0) parts.push(`$ ${compactNum(ars)}`)
  if (parts.length === 0) return <div style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>—</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {parts.map(p => (
        <div key={p} style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{p}</div>
      ))}
    </div>
  )
}

export default function KanbanColumn({ stage, leads, stageIndex, totalStages }: {
  stage: PipelineStage
  leads: Lead[]
  stageIndex: number
  totalStages: number
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const dotColor = stageIndex === totalStages - 1 ? 'var(--success)' : stageIndex === totalStages - 2 ? 'var(--gold)' : 'var(--ink)'

  return (
    <div ref={setNodeRef} style={{
      background: isOver ? 'var(--surface-2)' : 'var(--surface)',
      border: `1px solid ${isOver ? 'var(--border-strong)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: 12,
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'background .12s, border-color .12s',
    }}>
      {/* Column header */}
      <div style={{ paddingBottom: 10, borderBottom: '1px dashed var(--border)', marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
            {stage.name}
          </div>
          <div style={{
            minWidth: 22, height: 22, padding: '0 7px', borderRadius: 11,
            background: leads.length === 0 ? 'transparent' : 'var(--ink)',
            color: leads.length === 0 ? 'var(--ink-3)' : '#fff',
            border: leads.length === 0 ? '1px solid var(--border)' : '0',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 11.5,
            fontVariantNumeric: 'tabular-nums',
          }}>{leads.length}</div>
        </div>
        <div style={{ marginTop: 6 }}>
          <ColumnTotals leads={leads} />
        </div>
      </div>

      {/* Cards */}
      <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
        {leads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
      </SortableContext>

      {leads.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--ink-4)', textAlign: 'center', padding: '24px 8px' }}>Vacío</div>
      )}

      <button style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--ink-3)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        Agregar lead
      </button>
    </div>
  )
}

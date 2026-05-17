'use client'
import { useState, useMemo } from 'react'
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay, closestCorners,
} from '@dnd-kit/core'
import { createClient } from '@/lib/supabase/client'
import Topbar from '@/components/ui/topbar'
import KanbanColumn from '@/components/pipeline/kanban-column'
import LeadCard from '@/components/pipeline/lead-card'
import type { Lead, PipelineStage, Agent } from '@/lib/types'

type OpFilter = 'Todas' | 'Venta' | 'Alquiler'

function OpSwitch({ value, onChange }: { value: OpFilter; onChange: (v: OpFilter) => void }) {
  const opts: { k: OpFilter; label: string }[] = [
    { k: 'Todas', label: 'Todas' },
    { k: 'Venta', label: 'Ventas' },
    { k: 'Alquiler', label: 'Alquileres' },
  ]
  return (
    <div style={{ display: 'inline-flex', padding: 3, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, gap: 2 }}>
      {opts.map(opt => (
        <button key={opt.k} onClick={() => onChange(opt.k)} style={{
          padding: '8px 14px', borderRadius: 7, border: 0, cursor: 'pointer',
          fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 13,
          background: value === opt.k ? 'var(--ink)' : 'transparent',
          color: value === opt.k ? '#fff' : 'var(--ink-2)',
          transition: 'background .12s, color .12s',
          boxShadow: value === opt.k ? '0 1px 0 rgba(36,25,17,.06), 0 4px 10px -4px rgba(36,25,17,.18)' : 'none',
        }}>{opt.label}</button>
      ))}
    </div>
  )
}

export default function PipelineView({ initialLeads, stages, agents }: {
  initialLeads: Lead[]
  stages: PipelineStage[]
  agents: Agent[]
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [op, setOp] = useState<OpFilter>('Todas')
  const [activeId, setActiveId] = useState<string | null>(null)

  const supabase = createClient()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const filtered = useMemo(() =>
    leads.filter(l => op === 'Todas' || l.operation === op),
    [leads, op]
  )

  const activeLead = useMemo(() => leads.find(l => l.id === activeId), [leads, activeId])

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string)
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const leadId = active.id as string
    const targetStageId = over.id as string
    const lead = leads.find(l => l.id === leadId)
    if (!lead || lead.stage_id === targetStageId) return
    const newStage = stages.find(s => s.id === targetStageId)
    if (!newStage) return

    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, stage_id: targetStageId, stage: newStage } : l
    ))
    await supabase.from('leads').update({ stage_id: targetStageId }).eq('id', leadId)
    // Log activity
    const { data: { user } } = await supabase.auth.getUser()
    const { data: agent } = user ? await supabase.from('agents').select('id').eq('auth_user_id', user.id).single() : { data: null }
    if (agent) {
      await supabase.from('activities').insert({
        lead_id: leadId,
        agent_id: agent.id,
        type: 'Cambio_etapa',
        description: `Lead movido a etapa ${newStage.name}`,
      })
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Topbar
        crumb="WORKSPACE · PIPELINE"
        title="Pipeline de Operaciones"
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 13, border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>
              Filtros
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 13, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Nuevo Lead
            </button>
          </div>
        }
      />

      <div style={{ padding: '24px 32px 48px' }}>
        {/* Switch row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
          <OpSwitch value={op} onChange={setOp} />
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            Mostrando <strong style={{ color: 'var(--ink)' }}>{filtered.length}</strong> operaciones · cada propiedad en su moneda asignada
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontSize: 12, color: 'var(--ink-3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} /> Premium
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} /> Atrasado
            </span>
          </div>
        </div>

        {/* Kanban */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, minmax(260px, 1fr))`, gap: 14, alignItems: 'start' }}>
          {stages.map(stage => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              leads={filtered.filter(l => l.stage_id === stage.id)}
              stageIndex={stages.findIndex(s => s.id === stage.id)}
              totalStages={stages.length}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeLead && <LeadCard lead={activeLead} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}

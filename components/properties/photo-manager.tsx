'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { validateImage } from '@/lib/images'
import { fetchPhotos, uploadPhotos, deletePhoto, persistOrder } from '@/lib/property-photos'
import type { PropertyPhoto } from '@/lib/types'

export default function PhotoManager({
  propertyId,
  initialPhotos,
  onCoverChange,
}: {
  propertyId: string
  initialPhotos?: PropertyPhoto[]
  onCoverChange?: (coverUrl: string | null) => void
}) {
  const [photos, setPhotos] = useState<PropertyPhoto[]>(initialPhotos ?? [])
  const [loading, setLoading] = useState(initialPhotos === undefined)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialPhotos !== undefined) return
    let active = true
    fetchPhotos(propertyId)
      .then(p => { if (active) setPhotos(p) })
      .catch(e => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [propertyId, initialPhotos])

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    if (files.length === 0) return
    const errs = files.map(validateImage).filter(Boolean) as string[]
    const valid = files.filter(f => !validateImage(f))
    setError(errs.length ? errs.join(' · ') : null)
    if (valid.length === 0) return

    setUploading(true)
    setProgress({ done: 0, total: valid.length })
    try {
      const startPos = photos.length
      const added = await uploadPhotos(propertyId, valid, startPos, done => setProgress(p => ({ ...p, done })))
      const next = [...photos, ...added]
      setPhotos(next)
      onCoverChange?.(next[0]?.url ?? null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
      setProgress({ done: 0, total: 0 })
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [photos, propertyId, onCoverChange])

  async function applyOrder(next: PropertyPhoto[]) {
    const prev = photos
    setPhotos(next)
    onCoverChange?.(next[0]?.url ?? null)
    try {
      await persistOrder(propertyId, next)
    } catch (e) {
      setPhotos(prev) // revert si falla
      setError((e as Error).message)
    }
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= photos.length) return
    const next = [...photos]
    ;[next[i], next[j]] = [next[j], next[i]]
    applyOrder(next)
  }

  function makeCover(i: number) {
    if (i === 0) return
    const next = [...photos]
    const [it] = next.splice(i, 1)
    next.unshift(it)
    applyOrder(next)
  }

  async function remove(photo: PropertyPhoto) {
    setBusyId(photo.id)
    setError(null)
    const prev = photos
    const next = photos.filter(p => p.id !== photo.id)
    setPhotos(next)
    try {
      await deletePhoto(photo)
      await persistOrder(propertyId, next)
      onCoverChange?.(next[0]?.url ?? null)
    } catch (e) {
      setPhotos(prev)
      setError((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={e => e.target.files && handleFiles(e.target.files)}
        style={{ display: 'none' }}
      />

      {/* Dropzone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          if (!uploading && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
        }}
        style={{
          padding: '18px', borderRadius: 'var(--radius)',
          border: `2px dashed ${dragOver ? 'var(--gold)' : 'var(--border)'}`,
          background: dragOver ? 'var(--gold-soft)' : 'var(--surface)',
          cursor: uploading ? 'default' : 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          transition: 'all .15s', textAlign: 'center',
        }}
      >
        {uploading ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>
              Subiendo {progress.done} de {progress.total}…
            </div>
            <div style={{ width: '100%', maxWidth: 220, height: 5, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`, background: 'var(--gold)', transition: 'width .2s' }} />
            </div>
          </>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>Arrastrá fotos acá o hacé clic para subir</div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>JPG, PNG o WEBP · se comprimen y suben solas · varias a la vez</div>
          </>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 'var(--radius)', background: '#FBE8E5', border: '1px solid #E9CDC9', color: 'var(--danger)', fontSize: 12 }}>
          {error}
        </div>
      )}

      {/* Grid de miniaturas */}
      {loading ? (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', padding: '12px' }}>Cargando fotos…</div>
      ) : photos.length > 0 ? (
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
          {photos.map((photo, i) => (
            <div key={photo.id} style={{
              position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden',
              border: i === 0 ? '2px solid var(--gold)' : '1px solid var(--border)',
              aspectRatio: '4 / 3', background: 'var(--surface)',
              opacity: busyId === photo.id ? 0.5 : 1,
            }}>
              <img src={photo.url} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />

              {i === 0 && (
                <div style={{ position: 'absolute', top: 6, left: 6, padding: '2px 7px', borderRadius: 999, background: 'var(--gold)', color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em' }}>
                  PORTADA
                </div>
              )}

              {/* Controles */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 6, background: 'linear-gradient(to bottom, rgba(36,25,17,.35), transparent 30%, transparent 60%, rgba(36,25,17,.45))', opacity: 0, transition: 'opacity .15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
              >
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button title="Eliminar" onClick={() => remove(photo)} disabled={busyId === photo.id}
                    style={ctrlBtn('rgba(122,31,31,.92)')}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button title="Mover a la izquierda" onClick={() => move(i, -1)} disabled={i === 0}
                    style={{ ...ctrlBtn('rgba(36,25,17,.8)'), opacity: i === 0 ? 0.35 : 1 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  {i !== 0 && (
                    <button title="Marcar como portada" onClick={() => makeCover(i)} style={ctrlBtn('rgba(179,146,90,.95)')}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.5 5.8 21 7 14 2 9.3 9 8.5 12 2" /></svg>
                    </button>
                  )}
                  <button title="Mover a la derecha" onClick={() => move(i, 1)} disabled={i === photos.length - 1}
                    style={{ ...ctrlBtn('rgba(36,25,17,.8)'), opacity: i === photos.length - 1 ? 0.35 : 1 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-4)', textAlign: 'center', padding: '8px' }}>
          Todavía no hay fotos cargadas.
        </div>
      )}
    </div>
  )
}

function ctrlBtn(bg: string): React.CSSProperties {
  return {
    width: 26, height: 26, borderRadius: '50%', border: 'none', background: bg,
    color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0,
  }
}

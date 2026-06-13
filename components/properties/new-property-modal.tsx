'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validateImage } from '@/lib/images'
import { uploadPhotos } from '@/lib/property-photos'
import type { Property } from '@/lib/types'

// Localidades del Alto Valle + barrios/zonas que ya usan las propiedades cargadas.
// El campo es de texto libre: estas son solo sugerencias.
const ZONE_SUGGESTIONS = [
  'Neuquén Capital', 'Cipolletti', 'Centenario', 'Plottier', 'Confluencia',
  'Cinco Saltos', 'Allen', 'General Roca',
  'Centro', 'Área Centro Este', 'Área Centro Oeste', 'Río Grande', 'San Pablo',
]

export default function NewPropertyModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (prop: Property) => void
}) {
  const [address, setAddress] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [type, setType] = useState<Property['type']>('Departamento')
  const [operation, setOperation] = useState<Property['operation']>('Venta')
  const [priceUsd, setPriceUsd] = useState('')
  const [priceArs, setPriceArs] = useState('')
  const [currencyListing, setCurrencyListing] = useState<'USD' | 'ARS'>('USD')
  const [sqm, setSqm] = useState('')
  const [rooms, setRooms] = useState('')
  const [status, setStatus] = useState<Property['status']>('Disponible')
  const [premium, setPremium] = useState(false)
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Previews de los archivos en buffer (se suben recién al crear la propiedad)
  const previews = useMemo(() => files.map(f => ({ name: f.name, url: URL.createObjectURL(f) })), [files])
  useEffect(() => () => { previews.forEach(p => URL.revokeObjectURL(p.url)) }, [previews])

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list)
    const errs = incoming.map(validateImage).filter(Boolean) as string[]
    const valid = incoming.filter(f => !validateImage(f))
    setError(errs.length ? errs.join(' · ') : '')
    if (valid.length) setFiles(prev => [...prev, ...valid])
  }

  function removeFile(i: number) {
    setFiles(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!address.trim()) return
    setLoading(true)
    setError('')
    const supabase = createClient()

    // First insert the property (photo_url set after upload)
    const { data, error: err } = await supabase
      .from('properties')
      .insert({
        address: address.trim(),
        neighborhood: neighborhood || null,
        type,
        operation,
        price_usd: priceUsd ? Number(priceUsd) : null,
        price_ars: priceArs ? Number(priceArs) : null,
        currency_listing: currencyListing,
        sqm: sqm ? Number(sqm) : null,
        rooms: rooms ? Number(rooms) : null,
        status,
        premium,
        description: description || null,
        photo_url: null,
      })
      .select('*')
      .single()

    if (err) { setError(err.message); setLoading(false); return }
    if (!data) { setLoading(false); return }

    // Subir las fotos seleccionadas (si hay) y fijar la portada
    let finalPhotoUrl: string | null = null
    if (files.length) {
      setUploadingImage(true)
      try {
        const added = await uploadPhotos(data.id, files, 0)
        finalPhotoUrl = added[0]?.url ?? null   // la portada la sincroniza la API
      } catch (uploadErr) {
        // La propiedad ya se creó; avisamos pero no la perdemos
        setError(`Propiedad creada, pero falló la subida de fotos: ${(uploadErr as Error).message}`)
      }
      setUploadingImage(false)
    }

    onCreated({ ...(data as Property), photo_url: finalPhotoUrl })
    onClose()
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit',
    color: 'var(--ink)', background: '#fff', outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5, display: 'block',
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(36,25,17,0.4)', backdropFilter: 'blur(3px)', zIndex: 80 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 560, maxHeight: '90vh', background: '#fff', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(36,25,17,.22)', zIndex: 90,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>INVENTARIO · NUEVA</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-jakarta)', marginTop: 3 }}>Agregar propiedad</h2>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff', color: 'var(--ink-2)', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Dirección *</label>
              <input required value={address} onChange={e => setAddress(e.target.value)} placeholder="Av. Corrientes 3456, CABA" style={inp} autoFocus />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Barrio / Localidad</label>
                <input
                  value={neighborhood}
                  onChange={e => setNeighborhood(e.target.value)}
                  list="barrio-options"
                  placeholder="Ej: Neuquén Capital, Cipolletti…"
                  style={inp}
                />
                <datalist id="barrio-options">
                  {ZONE_SUGGESTIONS.map(n => <option key={n} value={n} />)}
                </datalist>
              </div>
              <div>
                <label style={lbl}>Tipo</label>
                <select value={type} onChange={e => setType(e.target.value as Property['type'])} style={{ ...inp, appearance: 'none', cursor: 'pointer' }}>
                  <option value="Departamento">Departamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Lote">Lote</option>
                  <option value="Local">Local</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Operación</label>
                <select value={operation} onChange={e => setOperation(e.target.value as Property['operation'])} style={{ ...inp, appearance: 'none', cursor: 'pointer' }}>
                  <option value="Venta">Venta</option>
                  <option value="Alquiler">Alquiler</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Estado</label>
                <select value={status} onChange={e => setStatus(e.target.value as Property['status'])} style={{ ...inp, appearance: 'none', cursor: 'pointer' }}>
                  <option value="Disponible">Disponible</option>
                  <option value="Reservada">Reservada</option>
                  <option value="Vendida">Vendida</option>
                  <option value="Alquilada">Alquilada</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>M²</label>
                <input type="number" value={sqm} onChange={e => setSqm(e.target.value)} placeholder="85" min="0" style={inp} />
              </div>
              <div>
                <label style={lbl}>Ambientes</label>
                <input type="number" value={rooms} onChange={e => setRooms(e.target.value)} placeholder="3" min="0" max="20" style={inp} />
              </div>
            </div>

            <div>
              <label style={lbl}>Moneda de listado</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['USD', 'ARS'] as const).map(c => (
                  <button key={c} type="button" onClick={() => setCurrencyListing(c)} style={{
                    flex: 1, padding: '9px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                    background: currencyListing === c ? 'var(--ink)' : '#fff',
                    color: currencyListing === c ? '#fff' : 'var(--ink-2)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .12s',
                  }}>{c}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Precio USD</label>
                <input type="number" value={priceUsd} onChange={e => setPriceUsd(e.target.value)} placeholder="150000" min="0" style={inp} />
              </div>
              <div>
                <label style={lbl}>Precio ARS</label>
                <input type="number" value={priceArs} onChange={e => setPriceArs(e.target.value)} placeholder="180000000" min="0" style={inp} />
              </div>
            </div>

            <div>
              <label style={lbl}>Descripción</label>
              <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles adicionales de la propiedad..." style={{ ...inp, resize: 'none', lineHeight: 1.5 }} />
            </div>

            {/* Fotos */}
            <div>
              <label style={lbl}>Fotos {files.length > 0 && <span style={{ color: 'var(--ink-4)' }}>· la primera es la portada</span>}</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={e => e.target.files && addFiles(e.target.files)}
                style={{ display: 'none' }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files) }}
                style={{
                  width: '100%', padding: '20px', borderRadius: 'var(--radius)',
                  border: `2px dashed ${dragOver ? 'var(--gold)' : 'var(--border)'}`,
                  background: dragOver ? 'var(--gold-soft)' : 'var(--surface)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center',
                }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>Arrastrá fotos o hacé clic</div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>JPG, PNG o WEBP · varias a la vez · se comprimen solas</div>
              </div>

              {previews.length > 0 && (
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
                  {previews.map((p, i) => (
                    <div key={p.url} style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', border: i === 0 ? '2px solid var(--gold)' : '1px solid var(--border)', aspectRatio: '4 / 3', background: 'var(--surface)' }}>
                      <img src={p.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      {i === 0 && <div style={{ position: 'absolute', top: 4, left: 4, padding: '1px 6px', borderRadius: 999, background: 'var(--gold)', color: '#fff', fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em' }}>PORTADA</div>}
                      <button type="button" onClick={() => removeFile(i)} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(36,25,17,.7)', border: 'none', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 14px', borderRadius: 'var(--radius)', border: `1px solid ${premium ? 'var(--gold)' : 'var(--border)'}`, background: premium ? 'var(--gold-soft)' : '#fff' }}>
              <input type="checkbox" checked={premium} onChange={e => setPremium(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--gold)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: premium ? '#6E5630' : 'var(--ink)' }}>Marcar como PREMIUM</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Precio &gt; USD 500.000 · aparece en vista Premium</div>
              </div>
            </label>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', background: '#FBE8E5', color: 'var(--danger)', fontSize: 13, border: '1px solid #E9CDC9' }}>
                Error: {error}
              </div>
            )}
          </div>

          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#fff' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading || uploadingImage || !address.trim()} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 20px', borderRadius: 'var(--radius)', border: 'none',
              background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: loading || uploadingImage || !address.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || uploadingImage || !address.trim() ? 0.65 : 1,
            }}>
              {uploadingImage ? 'Subiendo fotos…' : loading ? 'Guardando…' : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  Agregar propiedad
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

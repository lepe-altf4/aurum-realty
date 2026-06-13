// Helpers de cliente para fotos de propiedades.
// Las ESCRITURAS van por /api/properties/photos (admin-client server-side),
// así no dependen de las policies de Storage y funcionan igual en alta y edición.
// La compresión se hace en el browser antes de enviar (subida liviana y rápida).
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/images'
import type { PropertyPhoto } from '@/lib/types'

export async function fetchPhotos(propertyId: string): Promise<PropertyPhoto[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('property_photos')
    .select('*')
    .eq('property_id', propertyId)
    .order('position', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as PropertyPhoto[]
}

/** Comprime y sube cada archivo vía la API; devuelve las fotos creadas. */
export async function uploadPhotos(
  propertyId: string,
  files: File[],
  startPosition: number,
  onEach?: (done: number) => void
): Promise<PropertyPhoto[]> {
  const created: PropertyPhoto[] = []
  let pos = startPosition
  let done = 0

  for (const file of files) {
    const blob = await compressImage(file)
    const form = new FormData()
    form.append('file', blob, 'photo.webp')
    form.append('propertyId', propertyId)
    form.append('position', String(pos))

    const res = await fetch('/api/properties/photos', { method: 'POST', body: form })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error ?? `Error ${res.status} al subir la foto`)

    created.push(data.photo as PropertyPhoto)
    pos++
    done++
    onEach?.(done)
  }
  return created
}

export async function deletePhoto(photo: PropertyPhoto): Promise<void> {
  const res = await fetch('/api/properties/photos', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoId: photo.id }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? `Error ${res.status} al borrar la foto`)
  }
}

/** Renumera position 0..n según el orden del array y sincroniza la portada. */
export async function persistOrder(propertyId: string, photos: PropertyPhoto[]): Promise<void> {
  const res = await fetch('/api/properties/photos', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ propertyId, orderedIds: photos.map(p => p.id) }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? `Error ${res.status} al reordenar`)
  }
}

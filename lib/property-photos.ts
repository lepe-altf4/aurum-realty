// Helpers de cliente para fotos de propiedades (Supabase Storage + tabla).
// La portada (position 0) se cachea en properties.photo_url para que las
// vistas de listado no tengan que joinear property_photos.
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/images'
import type { PropertyPhoto } from '@/lib/types'

const BUCKET = 'property-photos'

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

/** Comprime y sube cada archivo; inserta la fila y devuelve las fotos creadas. */
export async function uploadPhotos(
  propertyId: string,
  files: File[],
  startPosition: number,
  onEach?: (done: number) => void
): Promise<PropertyPhoto[]> {
  const supabase = createClient()
  const created: PropertyPhoto[] = []
  let pos = startPosition
  let done = 0

  for (const file of files) {
    const blob = await compressImage(file)
    const path = `${propertyId}/${crypto.randomUUID()}.webp`

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: 'image/webp', upsert: false })
    if (upErr) throw new Error(`No se pudo subir la imagen: ${upErr.message}`)

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)

    const { data: row, error: insErr } = await supabase
      .from('property_photos')
      .insert({ property_id: propertyId, url: pub.publicUrl, storage_path: path, position: pos })
      .select('*')
      .single()
    if (insErr) {
      // rollback del archivo huérfano
      await supabase.storage.from(BUCKET).remove([path])
      throw new Error(`No se pudo guardar la foto: ${insErr.message}`)
    }

    created.push(row as PropertyPhoto)
    pos++
    done++
    onEach?.(done)
  }
  return created
}

export async function deletePhoto(photo: PropertyPhoto): Promise<void> {
  const supabase = createClient()
  if (photo.storage_path) {
    await supabase.storage.from(BUCKET).remove([photo.storage_path])
  }
  const { error } = await supabase.from('property_photos').delete().eq('id', photo.id)
  if (error) throw new Error(error.message)
}

/** Renumera position 0..n según el orden del array y sincroniza la portada. */
export async function persistOrder(propertyId: string, photos: PropertyPhoto[]): Promise<void> {
  const supabase = createClient()
  await Promise.all(
    photos.map((p, i) =>
      p.position === i
        ? Promise.resolve()
        : supabase.from('property_photos').update({ position: i }).eq('id', p.id)
    )
  )
  await syncCover(propertyId, photos[0]?.url ?? null)
}

/** Escribe la portada en properties.photo_url (caché para los listados). */
export async function syncCover(propertyId: string, coverUrl: string | null): Promise<void> {
  const supabase = createClient()
  await supabase.from('properties').update({ photo_url: coverUrl }).eq('id', propertyId)
}

// Validación + compresión de imágenes en el navegador (sin dependencias).
// Se usa antes de subir a Supabase Storage para que las fotos pesen poco
// y la subida sea rápida (clave para cargar en vivo durante la demo).

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_INPUT_BYTES = 15 * 1024 * 1024 // 15 MB por archivo de entrada

export function validateImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `"${file.name}": formato no soportado (usá JPG, PNG o WEBP).`
  }
  if (file.size > MAX_INPUT_BYTES) {
    return `"${file.name}": supera 15 MB.`
  }
  return null
}

/**
 * Reescala (máx. 1920px de lado mayor) y recomprime a WEBP.
 * Si algo falla, devuelve el archivo original para no bloquear la subida.
 */
export async function compressImage(
  file: File,
  opts?: { maxDim?: number; quality?: number }
): Promise<Blob> {
  const maxDim = opts?.maxDim ?? 1920
  const quality = opts?.quality ?? 0.82

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file // navegador viejo o formato raro → subir tal cual
  }

  const { width: ow, height: oh } = bitmap
  const scale = Math.min(1, maxDim / Math.max(ow, oh))

  // Ya es chica y liviana (y no es PNG pesado) → no tocar
  if (scale === 1 && file.size <= 700 * 1024 && file.type === 'image/jpeg') {
    bitmap.close?.()
    return file
  }

  const w = Math.round(ow * scale)
  const h = Math.round(oh * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close?.()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  const blob = await new Promise<Blob | null>(res =>
    canvas.toBlob(res, 'image/webp', quality)
  )
  // Si la compresión no ayudó, quedarse con el original
  if (!blob || blob.size >= file.size) return file
  return blob
}

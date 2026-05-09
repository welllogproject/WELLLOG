// Parse PostGIS geometry from Supabase into [lat, lng].
// Supabase devuelve geometry como GeoJSON { type, coordinates: [lng, lat] }.
// Tambien soportamos { lat, lng } por si algun cliente lo transforma.
export function parseGeoPoint(value: unknown): [number, number] | null {
  if (!value) return null
  const p = value as { lat?: unknown; lng?: unknown; coordinates?: unknown[] }
  const latRaw = p.lat ?? p.coordinates?.[1]
  const lngRaw = p.lng ?? p.coordinates?.[0]
  const lat = typeof latRaw === 'number' ? latRaw : Number(latRaw)
  const lng = typeof lngRaw === 'number' ? lngRaw : Number(lngRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return [lat, lng]
}

export function offsetCoords(lat: number, lng: number, deltaApprox = 0.0045): [number, number] {
  return [lat + (Math.random() - 0.5) * deltaApprox, lng + (Math.random() - 0.5) * deltaApprox]
}

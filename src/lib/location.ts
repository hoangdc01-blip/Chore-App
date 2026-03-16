/**
 * Get user's current location using browser Geolocation API.
 * Returns city/area name via reverse geocoding (free Nominatim API).
 */

interface LocationInfo {
  latitude: number
  longitude: number
  city: string
  country: string
  display: string
}

let cachedLocation: LocationInfo | null = null
let lastFetchTime = 0
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export async function getCurrentLocation(): Promise<LocationInfo | null> {
  // Return cache if fresh
  if (cachedLocation && Date.now() - lastFetchTime < CACHE_DURATION) {
    return cachedLocation
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: CACHE_DURATION,
      })
    })

    const { latitude, longitude } = position.coords

    // Reverse geocode using free Nominatim API (no API key needed)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
      { signal: AbortSignal.timeout(5000) }
    )

    if (!res.ok) {
      cachedLocation = { latitude, longitude, city: '', country: '', display: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}` }
      lastFetchTime = Date.now()
      return cachedLocation
    }

    const data = await res.json()
    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || ''
    const state = data.address?.state || ''
    const country = data.address?.country || ''
    const display = [city, state, country].filter(Boolean).join(', ')

    cachedLocation = { latitude, longitude, city, country, display }
    lastFetchTime = Date.now()
    return cachedLocation
  } catch {
    return null
  }
}

export function getCachedLocation(): LocationInfo | null {
  return cachedLocation
}

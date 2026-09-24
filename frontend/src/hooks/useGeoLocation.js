import { useCallback, useRef, useState } from 'react'

export const LOCATION_SOURCE = Object.freeze({ PRESET: 'preset', GEOLOCATION: 'geolocation' })
export const SYNC_STATE = Object.freeze({ IDLE: 'idle', REQUESTING: 'requesting', SUCCESS: 'success', ERROR: 'error' })

export default function useGeoLocation(initialPreset, onResolve) {
  const [coords, setCoords] = useState(initialPreset)
  const [selectedCity, setSelectedCity] = useState(initialPreset.label)
  const [locationSource, setLocationSource] = useState(LOCATION_SOURCE.PRESET)
  const [syncState, setSyncState] = useState(SYNC_STATE.IDLE)
  const [error, setError] = useState('')

  const selectPreset = useCallback(preset => {
    setCoords(preset); setSelectedCity(preset.label); setLocationSource(LOCATION_SOURCE.PRESET)
    setSyncState(SYNC_STATE.SUCCESS); setError(''); onResolve(preset, LOCATION_SOURCE.PRESET)
  }, [onResolve])

  // Only the newest request may update the screen: an older one that fails after a newer
  // one succeeded (the launch request and a button click can overlap) is ignored.
  const latest = useRef(0)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setSyncState(SYNC_STATE.ERROR); setError('Location is not supported by this browser. Please select a city manually.'); return }
    const id = ++latest.current
    setSyncState(SYNC_STATE.REQUESTING); setError('')
    navigator.geolocation.getCurrentPosition(
      position => {
        if (id !== latest.current) return
        const next = { label: 'Your location', lat: position.coords.latitude, lng: position.coords.longitude, accuracy: Math.round(position.coords.accuracy) }
        setCoords(next); setSelectedCity('Your location'); setLocationSource(LOCATION_SOURCE.GEOLOCATION); setSyncState(SYNC_STATE.SUCCESS); setError(''); onResolve(next, LOCATION_SOURCE.GEOLOCATION)
      },
      failure => {
        if (id !== latest.current) return
        setSyncState(SYNC_STATE.ERROR)
        setError(failure?.code === 1 ? 'Location permission denied. Allow location for this site, or select a city manually.'
          : failure?.code === 3 ? 'Finding your location took too long. Try again, or select a city manually.'
          : "Your location isn't available right now. Please select a city manually.")
      },
      // City-level accuracy is all the nearest-city match needs; high-accuracy GPS is slow on laptops.
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    )
  }, [onResolve])

  return { coords, selectedCity, locationSource, syncState, error, selectPreset, requestLocation }
}

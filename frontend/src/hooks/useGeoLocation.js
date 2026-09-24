import { useCallback, useState } from 'react'

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

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setSyncState(SYNC_STATE.ERROR); setError('Location is not supported by this browser. Please select a city manually.'); return }
    setSyncState(SYNC_STATE.REQUESTING); setError('')
    navigator.geolocation.getCurrentPosition(
      position => {
        const next = { label: 'Your location', lat: position.coords.latitude, lng: position.coords.longitude, accuracy: Math.round(position.coords.accuracy) }
        setCoords(next); setSelectedCity('Your location'); setLocationSource(LOCATION_SOURCE.GEOLOCATION); setSyncState(SYNC_STATE.SUCCESS); onResolve(next, LOCATION_SOURCE.GEOLOCATION)
      },
      () => { setSyncState(SYNC_STATE.ERROR); setError('Location permission denied. Please select a city manually.') },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }, [onResolve])

  return { coords, selectedCity, locationSource, syncState, error, selectPreset, requestLocation }
}

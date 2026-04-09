import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { GestureHandling } from 'leaflet-gesture-handling'
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css'
import { classifyCoordinates } from '../lib/earthEngine'
import type { ClassificationResult } from '../lib/earthEngine'

// Enable pinch-to-zoom / gesture handling on Mac trackpads
L.Map.addInitHook('addHandler', 'gestureHandling', GestureHandling)

// Fix Leaflet default marker icon broken by Vite's asset pipeline
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface ClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void
}

function ClickHandler({ onMapClick }: ClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

const CONFIDENCE_DOT: Record<'high' | 'medium' | 'low', string> = {
  high:   'bg-green-300',
  medium: 'bg-yellow-300',
  low:    'bg-gray-400',
}

interface MapPickerProps {
  onClassify: (result: ClassificationResult, coords: { lat: number; lng: number }) => void
}

export default function MapPicker({ onClassify }: MapPickerProps) {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleMapClick(lat: number, lng: number) {
    setPin({ lat, lng })
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const classification = await classifyCoordinates(lat, lng)
      setResult(classification)
      onClassify(classification, { lat, lng })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Classification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Land Cover Detection
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">Uses USGS NLCD 2021 satellite data</p>
      </div>

      {/* Map */}
      <div style={{ cursor: 'crosshair' }}>
        <MapContainer
          center={[38.5, -96]}
          zoom={4}
          style={{ height: '384px', width: '100%' }}
          scrollWheelZoom={true}
          tap={false}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...({ gestureHandling: true } as any)}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onMapClick={handleMapClick} />
          {pin && <Marker position={[pin.lat, pin.lng]} icon={defaultIcon} />}
        </MapContainer>
      </div>

      {/* Status bar */}
      {!loading && !result && !error && (
        <div className="bg-gray-50 border-t border-gray-100 px-4 py-2.5">
          <p className="text-xs text-gray-400 text-center">
            Click anywhere on the map to detect land cover
          </p>
        </div>
      )}

      {loading && (
        <div className="bg-green-50 border-t border-green-100 px-4 py-2.5 animate-pulse">
          <p className="text-xs text-green-700 text-center">
            Detecting land cover via USGS satellite data…
          </p>
        </div>
      )}

      {result && !loading && (
        <div className="bg-green-800 border-t border-green-900 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${CONFIDENCE_DOT[result.confidence]}`} />
            <span className="text-sm font-medium text-white">{result.nlcdLabel}</span>
            <span className="text-xs text-green-300 capitalize">{result.confidence} confidence</span>
          </div>
          <span className="text-xs text-green-400 text-right">
            Auto-populated below · Override anytime
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border-t border-red-100 px-4 py-2.5">
          <p className="text-xs text-red-600 text-center">
            Detection failed — select land type manually below
          </p>
        </div>
      )}

    </div>
  )
}

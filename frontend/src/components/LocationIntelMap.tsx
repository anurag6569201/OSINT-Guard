import L from 'leaflet'
import { useEffect } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import type { MapMarker } from '../lib/analyzeDatasets'

const DEFAULT_CENTER: [number, number] = [22.5, 78.5]
const DEFAULT_ZOOM_EMPTY = 4
const DEFAULT_ZOOM_SINGLE = 8

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

function FitView({ markers }: { markers: MapMarker[] }) {
  const map = useMap()

  useEffect(() => {
    if (markers.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM_EMPTY)
      return
    }
    if (markers.length === 1) {
      const m = markers[0]
      map.setView([m.lat, m.lng], DEFAULT_ZOOM_SINGLE)
      return
    }
    const b = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]))
    map.fitBounds(b, { padding: [28, 28], maxZoom: 8 })
  }, [map, markers])

  return null
}

export function LocationIntelMap({ markers }: { markers: MapMarker[] }) {
  const initialCenter = markers[0]
    ? ([markers[0].lat, markers[0].lng] as [number, number])
    : DEFAULT_CENTER
  const initialZoom = markers.length === 0 ? DEFAULT_ZOOM_EMPTY : markers.length === 1 ? DEFAULT_ZOOM_SINGLE : 5

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      className="intel-leaflet-map"
      scrollWheelZoom
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution={OSM_ATTRIBUTION}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitView markers={markers} />
      {markers.map((m) => (
        <CircleMarker
          key={m.id}
          center={[m.lat, m.lng]}
          radius={8}
          pathOptions={{
            color: 'var(--text-h)',
            weight: 2,
            fillColor: 'var(--accent)',
            fillOpacity: 0.88,
          }}
        >
          <Popup>
            <strong>{m.label}</strong>
            <br />
            <span style={{ fontSize: '0.85em', opacity: 0.85 }}>{m.source}</span>
            <br />
            <span style={{ fontSize: '0.8em' }}>{m.detail}</span>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}

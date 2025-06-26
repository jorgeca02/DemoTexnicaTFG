import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import L from 'leaflet'
import Link from 'next/link'

// Fix iconos
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
})

// Tipo genérico de estación
export interface EstacionConCoordenadas {
  nombre: string
  indicativo: string
  latitud: number
  longitud: number
}

interface MapaProps {
  estaciones: EstacionConCoordenadas[]
  base: string
}

export default function Mapa({ estaciones, base }: MapaProps) {
  return (
    <div className="mapa-container" style={{ width: '110%', height: '600px', transform: 'translate(-5px, -5px)' }}>
      <MapContainer
        style={{ width: '100%', height: '605px' }}
        center={[40.4168, -3.7038]}
        zoom={6}
        scrollWheelZoom={true}
        className="mapa"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        />
        {estaciones.map((e, i) => (
          <Marker key={i} position={[e.latitud, e.longitud]}>
            <Popup>
              <Link href={`${base}/${e.indicativo}`}>
                {e.nombre} ({e.indicativo})
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
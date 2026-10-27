'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Property } from '@/types'
import { formatCurrency } from '@/lib/utils'

// Fix Leaflet default icon resolution issue in webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Approximate map markers for common U.S. rental markets.
const US_CITY_COORDS: Record<string, [number, number]> = {
  "austin": [30.2672, -97.7431], "boston": [42.3601, -71.0589], "chicago": [41.8781, -87.6298],
  "dallas": [32.7767, -96.7970], "denver": [39.7392, -104.9903], "houston": [29.7604, -95.3698],
  "los angeles": [34.0522, -118.2437], "miami": [25.7617, -80.1918], "new york": [40.7128, -74.0060],
  "philadelphia": [39.9526, -75.1652], "phoenix": [33.4484, -112.0740], "san diego": [32.7157, -117.1611],
  "san francisco": [37.7749, -122.4194], "seattle": [47.6062, -122.3321], "washington": [38.9072, -77.0369],
}

function getCityCoords(city?: string): [number, number] | null {
  if (!city) return null
  const key = city.toLowerCase().trim()
  if (US_CITY_COORDS[key]) return US_CITY_COORDS[key]
  for (const [cityKey, coords] of Object.entries(US_CITY_COORDS)) {
    if (key.includes(cityKey) || cityKey.includes(key)) return coords
  }
  return null
}

interface PropertyMapProps {
  properties: Property[]
}

export default function PropertyMap({ properties }: PropertyMapProps) {
  const mappable = properties
    .map((p) => ({ property: p, coords: getCityCoords(p.city) }))
    .filter((item): item is { property: Property; coords: [number, number] } => item.coords !== null)

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-800/60 shadow-2xl relative">
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={6}
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mappable.map(({ property, coords }) => (
          <Marker key={property.id} position={coords}>
            <Popup>
              <div className="min-w-[200px] space-y-2 font-sans">
                {property.images && property.images.length > 0 && (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-28 object-cover rounded-lg"
                  />
                )}
                <p className="font-bold text-slate-900 text-sm leading-tight">
                  {property.title}
                </p>
                <p className="text-blue-600 font-extrabold text-base">
                  {formatCurrency(Number(property.price || 0))}
                  <span className="text-slate-400 font-normal text-xs ml-1">/yr</span>
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>&#127761; {property.bedrooms ?? '–'} Beds</span>
                  <span>&#128695; {property.bathrooms ?? '–'} Baths</span>
                </div>
                <p className="text-xs text-slate-400">
                  &#128205; {property.city}{property.state ? `, ${property.state}` : ''}
                </p>
                <a
                  href={`/listings/${property.id}`}
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-lg mt-2 transition-colors"
                >
                  View Details &#8594;
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {mappable.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-slate-400 text-sm font-semibold">
          No properties with recognized cities to display on the map.
        </div>
      )}
    </div>
  )
}

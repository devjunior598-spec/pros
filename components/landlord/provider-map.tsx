"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"
import { Star, MapPin, Phone } from "lucide-react"
import { ServiceProvider } from "@/types/maintenance"

// Fix for Leaflet default icon issues in Next.js
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
})


L.Marker.prototype.options.icon = DefaultIcon

interface ProviderMapProps {
    providers: ServiceProvider[]
}

export default function ProviderMap({ providers }: ProviderMapProps) {
    const center: [number, number] = [39.8283, -98.5795] // Geographic center of the contiguous U.S.

    // In a real app, we'd try to get user location here

    return (
        <div className="h-[500px] w-full rounded-lg overflow-hidden border">
            <MapContainer center={center} zoom={4} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {providers.map((p) => {
                    const cityCoordinates: Record<string, [number, number]> = {
                        Austin: [30.2672, -97.7431], Boston: [42.3601, -71.0589], Chicago: [41.8781, -87.6298],
                        Dallas: [32.7767, -96.797], Denver: [39.7392, -104.9903], Houston: [29.7604, -95.3698],
                        Miami: [25.7617, -80.1918], "New York": [40.7128, -74.006], Seattle: [47.6062, -122.3321],
                    };
                    const position = cityCoordinates[p.location_city || ""];
                    if (!position) return null;
                    return (
                        <Marker key={p.id} position={position} icon={DefaultIcon}>
                            <Popup>
                                <div className="p-1 space-y-2 min-w-[150px]">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-sm m-0">{p.provider?.full_name || p.provider?.name}</h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground m-0">{p.category}</p>
                                    <div className="flex items-center text-xs">
                                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                                        {p.rating} ({p.total_jobs_completed})
                                    </div>
                                    <div className="pt-2 border-t mt-2 flex gap-2">
                                        {p.provider?.phone && (
                                            <Button size="sm" variant="outline" className="h-7 text-xs flex-1" asChild>
                                                <a href={`tel:${p.provider.phone}`}>Call</a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </div>
    )
}

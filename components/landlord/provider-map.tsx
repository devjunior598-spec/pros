"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Badge } from "@/components/ui/badge"
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

const OnlineIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
})

const OfflineIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
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
    const [center, setCenter] = useState<[number, number]>([6.5244, 3.3792]) // Default Lagos

    // In a real app, we'd try to get user location here

    return (
        <div className="h-[500px] w-full rounded-lg overflow-hidden border">
            <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {providers.map((p) => {
                    // Provide fallback coordinates since explicit latitude/longitude were dropped from schema.
                    const lat = p.location_city === 'Lagos' ? 6.5244 : 9.0765;
                    const lng = p.location_city === 'Lagos' ? 3.3792 : 7.3986;
                    const isOnline = Math.random() > 0.5; // Simulate online status
                    return (
                        <Marker
                            key={p.id}
                            position={[lat, lng]}
                            icon={isOnline ? OnlineIcon : OfflineIcon}
                        >
                            <Popup>
                                <div className="p-1 space-y-2 min-w-[150px]">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-sm m-0">{p.provider?.full_name || p.provider?.name}</h3>
                                        <Badge variant={isOnline ? "default" : "outline"} className={isOnline ? "bg-green-600 h-4 text-[10px]" : "h-4 text-[10px]"}>
                                            {isOnline ? "Online" : "Offline"}
                                        </Badge>
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

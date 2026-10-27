"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Home, MapPin, Bookmark, ShieldCheck, Bed, Bath, MessageSquare } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card"
import { Property } from "@/types"

interface PropertyCardProps {
    property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
    const [imgError, setImgError] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const imageUrl = !imgError && property.images && property.images.length > 0 ? property.images[0] : null

    useEffect(() => {
        const saved = localStorage.getItem("saved_properties")
        if (saved) {
            const savedList = JSON.parse(saved) as string[]
            setIsSaved(savedList.includes(property.id))
        }
    }, [property.id])

    const toggleSave = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const saved = localStorage.getItem("saved_properties")
        let savedList: string[] = saved ? JSON.parse(saved) : []

        if (isSaved) {
            savedList = savedList.filter(id => id !== property.id)
            setIsSaved(false)
        } else {
            savedList.push(property.id)
            setIsSaved(true)
        }
        localStorage.setItem("saved_properties", JSON.stringify(savedList))
        window.dispatchEvent(new Event("saved_properties_changed"))
    }

    return (
        <Card className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_14px_34px_-26px_rgba(15,23,42,0.5)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_50px_-25px_rgba(15,23,42,0.42)]">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={property.title}
                        fill
                        loading="lazy"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Home className="h-12 w-12 opacity-30" />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-prms-navy/30 via-transparent to-transparent pointer-events-none" />

                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full border-white/30 bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm backdrop-blur">
                        {property.type}
                    </Badge>
                </div>

                <div className="absolute right-4 top-4 flex items-center gap-1.5">
                    <Badge className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase ${
                        property.status === 'available'
                            ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                        {property.status}
                    </Badge>

                    <button
                        onClick={toggleSave}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                            isSaved
                                ? "bg-red-500 border-red-400 text-white"
                                : "bg-black/40 hover:bg-black/60 border-white/20 text-white"
                        }`}
                        title={isSaved ? "Saved" : "Save Property"}
                    >
                        <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                    </button>
                </div>
            </div>

            <CardHeader className="flex-1 space-y-2 p-5 pb-2">
                {property.verification_status === 'approved' && (
                    <div className="flex items-center text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                        Verified Property
                    </div>
                )}

                <h3 className="line-clamp-1 text-lg font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {property.title}
                </h3>

                <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="mr-1 h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">{property.area}, {property.city}</span>
                </div>
            </CardHeader>

            <CardContent className="p-5 pt-0">
                <div className="mt-1 flex items-baseline gap-1 border-b border-border pb-4">
                    <span className="text-2xl font-semibold tracking-tight text-foreground">${property.price.toLocaleString()}</span>
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                        / {property.frequency ? (property.frequency.toLowerCase() === 'monthly' ? 'month' : 'year') : 'year'}
                    </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Bed className="h-4 w-4" />
                        <span>{property.bedrooms ?? '-'} Beds</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Bath className="h-4 w-4" />
                        <span>{property.bathrooms ?? '-'} Baths</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="mt-auto flex gap-2 p-5 pt-0">
                <Link href={`/listings/${property.id}`} className="flex-1">
                    <Button className="h-10 w-full rounded-xl text-xs" variant="outline">
                        View Details
                    </Button>
                </Link>
                <Link href={`/listings/${property.id}`} className="flex-shrink-0">
                    <Button size="icon" className="h-10 w-10 rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white" variant="ghost">
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    )
}

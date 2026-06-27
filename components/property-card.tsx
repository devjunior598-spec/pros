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
        <Card className="overflow-hidden group flex flex-col h-full bg-white border border-border shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <div className="aspect-[4/3] w-full bg-secondary relative overflow-hidden">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={property.title}
                        fill
                        loading="lazy"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Home className="h-12 w-12 opacity-30" />
                    </div>
                )}

                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-white/95 border-border font-medium text-[10px] uppercase tracking-wide text-foreground px-2 py-0.5 rounded-md">
                        {property.type}
                    </Badge>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <Badge className={`uppercase text-[9px] font-semibold px-2 py-0.5 rounded-md border ${
                        property.status === 'available'
                            ? 'bg-emerald-50 border-emerald-200 text-prms-emerald'
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                        {property.status}
                    </Badge>

                    <button
                        onClick={toggleSave}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-all ${
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

            <CardHeader className="p-4 pb-2 space-y-1.5 flex-1">
                {property.verification_status === 'approved' && (
                    <div className="flex items-center text-prms-emerald text-[10px] uppercase font-semibold tracking-wide">
                        <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                        Verified Property
                    </div>
                )}

                <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                    {property.title}
                </h3>

                <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="mr-1 h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">{property.area}, {property.city}</span>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-0">
                <div className="flex items-baseline gap-1 mt-1 border-b border-border pb-3">
                    <span className="text-xl font-semibold text-foreground">₦{property.price.toLocaleString()}</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                        / {property.frequency ? (property.frequency.toLowerCase() === 'monthly' ? 'month' : 'year') : 'year'}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground">
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

            <CardFooter className="p-4 pt-0 mt-auto flex gap-2">
                <Link href={`/listings/${property.id}`} className="flex-1">
                    <Button className="w-full h-10 text-xs rounded-lg" variant="outline">
                        View Details
                    </Button>
                </Link>
                <Link href={`/listings/${property.id}`} className="flex-shrink-0">
                    <Button size="icon" className="h-10 w-10 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all" variant="ghost">
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    )
}

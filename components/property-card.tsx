"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Home, MapPin, Tag, Bookmark, ShieldCheck, Bed, Bath, MessageSquare } from "lucide-react"

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

    // Check if property is saved in localStorage
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
        let savedList: string[] = []
        if (saved) {
            savedList = JSON.parse(saved)
        }

        if (isSaved) {
            savedList = savedList.filter(id => id !== property.id)
            setIsSaved(false)
        } else {
            savedList.push(property.id)
            setIsSaved(true)
        }
        localStorage.setItem("saved_properties", JSON.stringify(savedList))
        // Dispatch event so other components (like listings filters) can listen to it
        window.dispatchEvent(new Event("saved_properties_changed"))
    }

    return (
        <Card className="overflow-hidden group flex flex-col h-full bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/80 shadow-md hover:shadow-xl dark:hover:shadow-blue-500/5 transition-all duration-300 rounded-2xl relative font-sans">
            
            {/* Image section with relative overlays */}
            <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={property.title}
                        fill
                        loading="lazy"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-800">
                        <Home className="h-12 w-12 opacity-30" />
                    </div>
                )}

                {/* Glassmorphic Badge overlays */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200/40 dark:border-slate-800/40 font-bold text-[10px] uppercase tracking-wider text-slate-850 dark:text-slate-200 px-2 py-0.5 rounded-lg">
                        {property.type}
                    </Badge>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {/* Status Badge */}
                    <Badge className={`uppercase text-[9px] font-extrabold px-2 py-0.5 rounded-lg border ${
                        property.status === 'available' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                        }`}>
                        {property.status}
                    </Badge>

                    {/* Bookmark Toggle */}
                    <button 
                        onClick={toggleSave}
                        className={`h-7 w-7 rounded-lg flex items-center justify-center backdrop-blur border transition-all ${
                            isSaved 
                                ? "bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20" 
                                : "bg-black/40 hover:bg-black/60 border-white/20 text-white"
                        }`}
                        title={isSaved ? "Saved" : "Save Property"}
                    >
                        <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                    </button>
                </div>
            </div>

            <CardHeader className="p-4 pb-2 space-y-1.5 flex-1">
                {/* Verified Header */}
                <div className="flex items-center text-blue-600 dark:text-blue-400 text-[10px] uppercase font-extrabold tracking-widest">
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                    PRMS Verified
                </div>
                
                {/* Title */}
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 leading-snug line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {property.title}
                </h3>
                
                {/* Location */}
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <MapPin className="mr-1 h-3.5 w-3.5 text-red-500" />
                    <span className="line-clamp-1">{property.area}, {property.city}</span>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-0">
                {/* Pricing row */}
                <div className="flex items-baseline gap-1 mt-1 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <span className="text-xl font-black text-slate-900 dark:text-slate-50">₦{property.price.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">/ year</span>
                </div>

                {/* Specs row */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <Bed className="h-4 w-4 text-slate-400" />
                        <span>{property.bedrooms ?? '-'} Bedrooms</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Bath className="h-4 w-4 text-slate-400" />
                        <span>{property.bathrooms ?? '-'} Bathrooms</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 mt-auto flex gap-2">
                <Link href={`/listings/${property.id}`} className="flex-1">
                    <Button className="w-full font-bold h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800" variant="outline">
                        View Details
                    </Button>
                </Link>
                
                {/* Contact landlord button - redirects to messages or opens listings view */}
                <Link href={`/listings/${property.id}`} className="flex-shrink-0">
                    <Button size="icon" className="h-9 w-9 rounded-xl bg-blue-600/10 dark:bg-blue-600/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white transition-all" variant="ghost">
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    )
}

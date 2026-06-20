"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { PropertyCard } from "@/components/property-card"
import { Property } from "@/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, X, Bookmark, SlidersHorizontal, Home, LayoutList, Map } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

const PropertyMap = dynamic(
    () => import('@/components/listings/property-map'),
    {
        ssr: false,
        loading: () => <div className="h-[600px] bg-slate-900 animate-pulse rounded-2xl" />
    }
)

function ListingsContent() {
    const searchParams = useSearchParams()
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "")
    const [propertyType, setPropertyType] = useState<string>("all")
    const [priceRange, setPriceRange] = useState<string>("all")
    const [bedrooms, setBedrooms] = useState<string>("all")
    const [bathrooms, setBathrooms] = useState<string>("all")
    const [showSavedOnly, setShowSavedOnly] = useState(false)
    const [savedIds, setSavedIds] = useState<string[]>([])
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list')

    // Load saved properties from localStorage
    const loadSavedList = useCallback(() => {
        const saved = localStorage.getItem("saved_properties")
        if (saved) {
            setSavedIds(JSON.parse(saved) as string[])
        } else {
            setSavedIds([])
        }
    }, [])

    useEffect(() => {
        loadSavedList()
        // Listen to custom bookmark toggle events
        window.addEventListener("saved_properties_changed", loadSavedList)
        return () => {
            window.removeEventListener("saved_properties_changed", loadSavedList)
        }
    }, [loadSavedList])

    const fetchProperties = useCallback(async (signal?: AbortSignal) => {
        setLoading(true)
        try {
            let query = supabase
                .from('properties')
                .select('*')
                .eq('status', 'available')

            if (searchQuery.trim()) {
                const q = searchQuery.trim()
                // Search by city, area, title, or zip code
                query = query.or(`city.ilike.%${q}%,area.ilike.%${q}%,title.ilike.%${q}%,zip_code.ilike.%${q}%`)
            }

            if (propertyType !== "all") {
                query = query.eq('type', propertyType)
            }

            if (bedrooms !== "all") {
                if (bedrooms === "4+") {
                    query = query.gte('bedrooms', 4)
                } else {
                    query = query.eq('bedrooms', parseInt(bedrooms))
                }
            }

            if (bathrooms !== "all") {
                if (bathrooms === "3+") {
                    query = query.gte('bathrooms', 3)
                } else {
                    query = query.eq('bathrooms', parseInt(bathrooms))
                }
            }

            if (priceRange !== "all") {
                const [min, max] = priceRange.split('-').map(Number)
                if (max) {
                    query = query.gte('price', min).lte('price', max)
                } else {
                    query = query.gte('price', min)
                }
            }

            const { data, error } = await query.order('created_at', { ascending: false })

            if (error) throw error
            
            if (!signal?.aborted) {
                let list = data || []
                // Apply client-side Saved filter if enabled
                if (showSavedOnly) {
                    list = list.filter(p => savedIds.includes(p.id))
                }
                setProperties(list)
            }
        } catch (error: any) {
            if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.message?.includes('AbortError')) return
            console.error("Error fetching properties:", error?.message || error)
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }, [searchQuery, propertyType, priceRange, bedrooms, bathrooms, showSavedOnly, savedIds])

    useEffect(() => {
        const query = searchParams.get('q')
        if (query) {
            setSearchQuery(query)
        }
    }, [searchParams])

    useEffect(() => {
        const controller = new AbortController()
        const timer = setTimeout(() => {
            fetchProperties(controller.signal)
        }, 300)

        return () => {
            clearTimeout(timer)
            controller.abort()
        }
    }, [fetchProperties])

    const resetFilters = () => {
        setSearchQuery("")
        setPropertyType("all")
        setPriceRange("all")
        setBedrooms("all")
        setBathrooms("all")
        setShowSavedOnly(false)
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans">
            
            {/* Header and Hero Title section */}
            <div className="bg-slate-900 text-white py-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40%] h-full bg-blue-600/10 blur-3xl rounded-full" />
                <div className="container mx-auto px-4 relative z-10 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                        Find Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Dream Home</span>
                    </h1>
                    <p className="text-slate-400 text-base max-w-xl leading-relaxed">
                        Search and filter through vetted, scam-free properties across the city. Securing your rental has never been easier.
                    </p>
                </div>
            </div>

            {/* Main Interactive Controls */}
            <div className="container mx-auto px-4 py-8">
                
                {/* Search and Action Bar */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
                    
                    {/* Search Field */}
                    <div className="flex-1 max-w-2xl relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                        <Input
                          placeholder="Search city, area, neighborhood, or zip..."
                          className="pl-10 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 shadow-sm"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filter Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* List / Map View Toggle */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className={`h-9 px-4 rounded-lg font-bold text-xs gap-1.5 transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <LayoutList className="h-3.5 w-3.5" /> List View
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('map')}
                                className={`h-9 px-4 rounded-lg font-bold text-xs gap-1.5 transition-all ${
                                    viewMode === 'map'
                                        ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <Map className="h-3.5 w-3.5" /> Map View
                            </Button>
                        </div>

                        <Button
                            variant={isFilterOpen ? "secondary" : "outline"}
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="h-12 px-5 rounded-xl gap-2 font-bold text-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900"
                        >
                            <SlidersHorizontal className="h-4.5 w-4.5" />
                            Filters
                        </Button>

                        {/* Save Toggle */}
                        <Button
                            variant={showSavedOnly ? "destructive" : "outline"}
                            onClick={() => setShowSavedOnly(!showSavedOnly)}
                            className={`h-12 px-5 rounded-xl gap-2 font-bold text-sm border-slate-200 dark:border-slate-800 ${
                                showSavedOnly 
                                    ? "bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/10" 
                                    : "dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                            }`}
                        >
                            <Bookmark className={`h-4 w-4 ${showSavedOnly ? "fill-current" : ""}`} />
                            Saved ({savedIds.length})
                        </Button>

                        {(searchQuery || propertyType !== "all" || priceRange !== "all" || bedrooms !== "all" || bathrooms !== "all" || showSavedOnly) && (
                            <Button variant="ghost" onClick={resetFilters} className="h-12 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-500/5 px-4 rounded-xl">
                                <X className="mr-1.5 h-4 w-4" /> Clear All
                            </Button>
                        )}
                    </div>
                </div>

                {/* Advanced Filters Expandable Grid */}
                {isFilterOpen && (
                    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-3 duration-200 text-slate-900 dark:text-slate-100 font-sans">
                        
                        {/* Type Select */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Property Type</label>
                            <Select value={propertyType} onValueChange={setPropertyType}>
                                <SelectTrigger className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="Apartment">Apartment</SelectItem>
                                    <SelectItem value="Studio">Studio</SelectItem>
                                    <SelectItem value="Duplex">Duplex</SelectItem>
                                    <SelectItem value="House">House</SelectItem>
                                    <SelectItem value="Office">Office</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Price Range Select */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Price Range (Annual)</label>
                            <Select value={priceRange} onValueChange={setPriceRange}>
                                <SelectTrigger className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl">
                                    <SelectValue placeholder="Any Price" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any Price</SelectItem>
                                    <SelectItem value="0-500000">Under ₦500k</SelectItem>
                                    <SelectItem value="500000-1500000">₦500k - ₦1.5M</SelectItem>
                                    <SelectItem value="1500000-3000000">₦1.5M - ₦3M</SelectItem>
                                    <SelectItem value="3000000-5000000">₦3M - ₦5M</SelectItem>
                                    <SelectItem value="5000000-10000000">₦5M - ₦10M</SelectItem>
                                    <SelectItem value="10000000">Above ₦10M</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Bedrooms Select */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Bedrooms</label>
                            <Select value={bedrooms} onValueChange={setBedrooms}>
                                <SelectTrigger className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl">
                                    <SelectValue placeholder="Any Bedrooms" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any Bedrooms</SelectItem>
                                    <SelectItem value="1">1 Bedroom</SelectItem>
                                    <SelectItem value="2">2 Bedrooms</SelectItem>
                                    <SelectItem value="3">3 Bedrooms</SelectItem>
                                    <SelectItem value="4+">4+ Bedrooms</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Bathrooms Select */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Bathrooms</label>
                            <Select value={bathrooms} onValueChange={setBathrooms}>
                                <SelectTrigger className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl">
                                    <SelectValue placeholder="Any Bathrooms" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any Bathrooms</SelectItem>
                                    <SelectItem value="1">1 Bathroom</SelectItem>
                                    <SelectItem value="2">2 Bathrooms</SelectItem>
                                    <SelectItem value="3+">3+ Bathrooms</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                    </div>
                )}

                {/* Listings Results View */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Fetching listings...</p>
                    </div>
                ) : viewMode === 'map' ? (
                    <div className="space-y-3">
                        <p className="text-xs text-slate-400 font-semibold">
                            Showing {properties.length} propert{properties.length === 1 ? 'y' : 'ies'} on map
                        </p>
                        <PropertyMap properties={properties} />
                    </div>
                ) : properties.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {properties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/40 max-w-2xl mx-auto space-y-4">
                        <Home className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
                        <h3 className="text-xl font-bold text-slate-850 dark:text-slate-200">No properties match your filter</h3>
                        <p className="text-slate-400 text-xs max-w-sm mx-auto">
                            Try modifying your filters, clearing your search query, or checking back later as new properties are added daily.
                        </p>
                        <Button variant="outline" className="mt-4 rounded-xl font-bold border-slate-200 dark:border-slate-800" onClick={resetFilters}>
                            Reset Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ListingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-sm text-slate-500 font-semibold">Loading Listings System...</p>
            </div>
        }>
            <ListingsContent />
        </Suspense>
    )
}

"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Loader2,
    Search,
    MapPin,
    Phone,
    MessageCircle,
    Star,
    Wrench,
    Filter
} from "lucide-react"
import dynamic from "next/dynamic"
import { HireProviderDialog } from "./hire-provider-dialog"
import { LandlordServiceJobs } from "./landlord-service-jobs"

const ProviderMap = dynamic(() => import("./provider-map"), {
    ssr: false,
    loading: () => <div className="h-[500px] w-full bg-muted animate-pulse rounded-lg flex items-center justify-center">Loading Map...</div>
})

interface ServiceDirectoryProps {
    landlordId: string
}

export function ServiceDirectory({ landlordId }: ServiceDirectoryProps) {
    const [providers, setProviders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [view, setView] = useState<'directory' | 'jobs' | 'map'>('directory')

    const categories = [
        'General Repairs',
        'Plumbing Works',
        'Electrical Works',
        'Building & Structural Works',
        'Finishing Works',
        'Carpentry Works',
        'Glass & Aluminum Works',
        'Tiling & Flooring',
        'HVAC / Cooling',
        'Security & Fittings',
        'Exterior & Outdoor'
    ]

    useEffect(() => {
        async function fetchProviders() {
            setLoading(true)
            let query = supabase
                .from('service_providers')
                .select('*, provider:profiles!service_providers_user_id_fkey(*)')
                .eq('approval_status', 'approved')
                .order('rating', { ascending: false })

            if (selectedCategory) {
                query = query.eq('category', selectedCategory)
            }

            const { data, error } = await query

            if (error) {
                console.error("Error fetching providers:", error)
            } else {
                setProviders(data || [])
            }
            setLoading(false)
        }

        fetchProviders()
    }, [selectedCategory])

    const filteredProviders = providers.filter(p =>
        p.provider?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.provider?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.location_city?.toLowerCase().includes(search.toLowerCase()) ||
        p.bio?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Service Directory</h2>
                    <p className="text-muted-foreground">Find trusted professionals for your property maintenance.</p>
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant={view === 'directory' ? 'default' : 'outline'}
                        onClick={() => setView('directory')}
                    >
                        Directory
                    </Button>
                    <Button
                        variant={view === 'map' ? 'default' : 'outline'}
                        onClick={() => setView('map')}
                    >
                        Map View
                    </Button>
                    <Button
                        variant={view === 'jobs' ? 'default' : 'outline'}
                        onClick={() => setView('jobs')}
                    >
                        My Jobs
                    </Button>
                </div>
            </div>

            {view === 'jobs' ? (
                <LandlordServiceJobs landlordId={landlordId} />
            ) : view === 'map' ? (
                <ProviderMap providers={providers} />
            ) : (
                <>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, city, or keyword..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                            <Button
                                variant={selectedCategory === null ? "default" : "outline"}
                                onClick={() => setSelectedCategory(null)}
                                className="whitespace-nowrap"
                            >
                                All
                            </Button>
                            {categories.map(cat => (
                                <Button
                                    key={cat}
                                    variant={selectedCategory === cat ? "default" : "outline"}
                                    onClick={() => setSelectedCategory(cat)}
                                    className="whitespace-nowrap"
                                >
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : filteredProviders.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                            <Wrench className="mx-auto h-12 w-12 mb-4 opacity-20" />
                            <p className="text-muted-foreground">No providers found for this category or search.</p>
                            <Button variant="link" onClick={() => { setSearch(''); setSelectedCategory(null); }}>
                                Clear filters
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredProviders.map((provider) => (
                                <Card key={provider.id} className="flex flex-col hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="secondary" className="mb-2">{provider.category}</Badge>
                                            {provider.verified && (
                                                <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Verified</Badge>
                                            )}
                                        </div>
                                        <CardTitle className="text-xl">{provider.provider?.full_name || provider.provider?.name}</CardTitle>
                                        <CardDescription className="flex items-center mt-1">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            {provider.location_city}{provider.location_state ? `, ${provider.location_state}` : ''}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col pt-0">
                                        <div className="flex items-center mb-4 space-x-1">
                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                            <span className="font-semibold">{provider.rating}</span>
                                            <span className="text-muted-foreground text-sm">({provider.total_jobs_completed} jobs completed)</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-6 line-clamp-3 flex-1">
                                            {provider.bio}
                                        </p>
                                        <div className="grid grid-cols-2 gap-3 mt-auto">
                                            <HireProviderDialog
                                                provider={provider}
                                                landlordId={landlordId}
                                                onSuccess={() => setView('jobs')}
                                            />
                                            {provider.provider?.phone && (
                                                <Button variant="outline" className="w-full" asChild>
                                                    <a href={`tel:${provider.provider.phone}`}>
                                                        <Phone className="mr-2 h-4 w-4" />
                                                        Call
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

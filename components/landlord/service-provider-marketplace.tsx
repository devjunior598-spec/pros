"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Search,
    Star,
    Phone,
    Mail,
    ExternalLink,
    Globe,
    CheckCircle2,
    Loader2,
    MapPin,
    UserPlus,
    Clock,
    Briefcase
} from "lucide-react"
import { ServiceProvider, MaintenanceRequest } from "@/types/maintenance"

interface ServiceProviderMarketplaceProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    request: MaintenanceRequest | null
    onAssign: (providerId: string) => void
}

const CATEGORIES = [
    "Plumbing", "Electrical", "Rewiring", "Carpentry",
    "Painting", "Tiling", "Roofing", "AC Repair",
    "Waste Disposal", "General Handyman"
]

export function ServiceProviderMarketplace({
    isOpen,
    onOpenChange,
    request,
    onAssign
}: ServiceProviderMarketplaceProps) {
    const [providers, setProviders] = useState<ServiceProvider[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [assigning, setAssigning] = useState<string | null>(null)
    const [quotes, setQuotes] = useState<any[]>([])
    const [fetchingQuotes, setFetchingQuotes] = useState(false)

    const fetchQuotes = useCallback(async (signal?: AbortSignal) => {
        if (!request) return
        setFetchingQuotes(true)
        try {
            let query = supabase
                .from('repair_quotes')
                .select(`
                    *,
                    provider:service_providers (
                        *,
                        provider_profile:profiles!service_providers_user_id_fkey(*)
                    )
                `)
                .eq('request_id', request.id)
                .order('created_at', { ascending: false })

            if (signal) {
                query = query
            }

            const { data, error } = await query

            if (error) {
                if (!signal?.aborted) throw error
            } else if (!signal?.aborted) {
                setQuotes(data || [])
            }
        } catch (error) {
            if (signal?.aborted) return
            console.error("Error fetching quotes:", error)
        } finally {
            if (!signal?.aborted) {
                setFetchingQuotes(false)
            }
        }
    }, [request])

    const fetchProviders = useCallback(async (signal?: AbortSignal) => {
        setLoading(true)
        try {
            let query = supabase
                .from('service_providers')
                .select('*, provider:profiles!service_providers_user_id_fkey(*)')
                .eq('approval_status', 'approved')
                .order('rating', { ascending: false })

            if (signal) {
                query = query
            }

            const { data, error } = await query

            if (error) {
                if (!signal?.aborted) throw error
            } else if (!signal?.aborted) {
                setProviders(data || [])
            }
        } catch (error: any) {
            if (signal?.aborted) return
            console.error("Error fetching providers:", error)
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        let mounted = true
        if (isOpen) {
            fetchProviders()
            if (request) {
                fetchQuotes()
            }
        }
        return () => { mounted = false }
    }, [isOpen, request, fetchProviders, fetchQuotes])

    const filteredProviders = providers.filter(provider => {
        const matchesSearch = provider.provider?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            provider.provider?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            provider.location_city?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === "all" || provider.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const handleAcceptQuote = async (quote: any) => {
        if (!request) return
        setAssigning(quote.provider_id)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // 1. Create assignment from quote
            const { error: assignError } = await supabase
                .from('repair_assignments')
                .insert({
                    request_id: request.id,
                    provider_id: quote.provider_id,
                    landlord_id: user.id,
                    agreed_price: quote.quoted_price,
                    status: 'assigned'
                })

            if (assignError) throw assignError

            // 2. Update quote statuses
            await supabase
                .from('repair_quotes')
                .update({ status: 'accepted' })
                .eq('id', quote.id)

            await supabase
                .from('repair_quotes')
                .update({ status: 'rejected' })
                .eq('request_id', request.id)
                .neq('id', quote.id)

            // 3. Update request status
            await supabase
                .from('maintenance_requests')
                .update({ status: 'assigned' })
                .eq('id', request.id)

            onAssign(quote.provider_id)
            onOpenChange(false)
            alert("Quote accepted and provider assigned!")
        } catch (error: any) {
            console.error("Error accepting quote:", error)
            alert("Failed to accept quote: " + error.message)
        } finally {
            setAssigning(null)
        }
    }

    const handleAssign = async (providerId: string) => {
        if (!request) return
        setAssigning(providerId)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { error } = await supabase
                .from('repair_assignments')
                .insert({
                    request_id: request.id,
                    provider_id: providerId,
                    landlord_id: user.id,
                    status: 'assigned'
                })

            if (error) throw error

            // Also update maintenance request status
            await supabase
                .from('maintenance_requests')
                .update({ status: 'assigned' })
                .eq('id', request.id)

            onAssign(providerId)
            onOpenChange(false)
            alert("Provider assigned successfully!")
        } catch (error: any) {
            console.error("Error assigning provider:", error)
            alert("Failed to assign provider")
        } finally {
            setAssigning(null)
        }
    }

    const getLocation = () => {
        // In a real app, this would come from the property location
        return "Lagos"
    }

    const getExternalLinks = (category: string) => {
        const location = getLocation()
        const query = `${category} in ${location}`
        return [
            { name: "Jiji Nigeria", url: `https://jiji.ng/search?query=${encodeURIComponent(query)}` },
            { name: "OList Nigeria", url: `https://olist.ng/search?q=${encodeURIComponent(query)}` },
            { name: "VConnect Nigeria", url: `https://www.vconnect.com/search?query=${encodeURIComponent(query)}` }
        ]
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Globe className="h-6 w-6 text-blue-600" />
                        Service Provider Marketplace
                    </DialogTitle>
                    <DialogDescription>
                        Find and assign verified service providers for your maintenance requests.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 pt-2 space-y-6 overflow-hidden flex flex-col">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or location..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {CATEGORIES.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-6">
                            {/* Quotes Section */}
                            {quotes.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Incoming Quotes ({quotes.length})
                                    </h3>
                                    <div className="grid gap-4">
                                        {quotes.map(quote => (
                                            <div key={quote.id} className="p-4 border-2 border-blue-100 rounded-xl bg-blue-50/30 flex flex-col md:flex-row justify-between gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-lg">{quote.provider?.provider_profile?.full_name || quote.provider?.provider_profile?.name}</h4>
                                                        <Badge variant="outline" className="bg-white">{quote.provider?.category}</Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-700 italic border-l-2 border-blue-200 pl-3 py-1">
                                                        "{quote.message}"
                                                    </p>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                            {quote.provider?.rating}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {quote.provider?.location_city}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end justify-between gap-2">
                                                    <div className="text-lg font-bold text-blue-700">₦{quote.quoted_price?.toLocaleString()}</div>
                                                    <Button
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700 w-full"
                                                        onClick={() => handleAcceptQuote(quote)}
                                                        disabled={!!assigning}
                                                    >
                                                        Accept Quote
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Providers Section */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" /> Explore Providers
                                </h3>
                                {loading ? (
                                    <div className="flex items-center justify-center h-40">
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                    </div>
                                ) : filteredProviders.length > 0 ? (
                                    <div className="grid gap-3">
                                        {filteredProviders.map(provider => (
                                            <div key={provider.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-xl bg-card hover:border-blue-200 transition-colors gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold">{provider.provider?.full_name || provider.provider?.name}</h4>
                                                        {provider.verified && (
                                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 h-5 text-[10px]">
                                                                <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                                                            </Badge>
                                                        )}
                                                        <Badge variant="outline" className="h-5 text-[10px]">{provider.category}</Badge>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                            <span className="font-medium text-foreground">{provider.rating}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {provider.location_city}, {provider.location_state}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAssign(provider.id)}
                                                    disabled={!!assigning}
                                                >
                                                    Assign Directly
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border border-dashed rounded-xl">
                                        <p className="text-muted-foreground mb-4">No in-app providers found matching your criteria.</p>
                                        <div className="space-y-4">
                                            <p className="text-sm font-semibold uppercase tracking-wider">Try External Platforms (Nigeria Focus)</p>
                                            <div className="flex flex-wrap justify-center gap-3">
                                                {getExternalLinks(selectedCategory === "all" ? "Service" : selectedCategory).map(link => (
                                                    <Button key={link.name} variant="outline" size="sm" asChild>
                                                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-3 w-3 mr-2" />
                                                            Search on {link.name}
                                                        </a>
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                </div>

                <div className="p-6 border-t bg-gray-50/50">
                    <div className="flex flex-col gap-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Can't find what you're looking for?</p>
                        <div className="flex flex-wrap gap-3">
                            {getExternalLinks("Handyman").map(link => (
                                <a
                                    key={link.name}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    <ExternalLink className="h-3 w-3" /> {link.name}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 border-t">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Loader2, Search, Star } from "lucide-react"

interface ProviderMarketplaceModalProps {
    requestId: string
    onAssign: (providerId: string) => void
}

export function ProviderMarketplaceModal({ requestId, onAssign }: ProviderMarketplaceModalProps) {
    const [open, setOpen] = useState(false)
    const [providers, setProviders] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState("")

    useEffect(() => {
        if (open) {
            fetchProviders()
        }
    }, [open])

    const fetchProviders = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('service_providers')
            .select('*')
        // .eq('verified', true) // Only show verified providers

        if (error) console.error('Error fetching providers:', error)
        else setProviders(data || [])
        setLoading(false)
    }

    const filteredProviders = providers.filter(p =>
        p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase())
    )

    const handleAssign = async (providerId: string) => {
        setLoading(true)
        try {
            await onAssign(providerId)
            setOpen(false)
        } catch (error) {
            console.error('Error assigning provider:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Browse Marketplace</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Hire Service Provider</DialogTitle>
                    <DialogDescription>
                        Browse and select a verified service provider for this job.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center space-x-2 py-4">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <ScrollArea className="flex-1 pr-4">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredProviders.map((provider) => (
                                <div key={provider.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50">
                                    <div className="flex gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.id}`} />
                                            <AvatarFallback>{provider.full_name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-semibold">{provider.full_name}</h4>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Badge variant="secondary">{provider.category}</Badge>
                                                <span>•</span>
                                                <div className="flex items-center text-yellow-500">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    <span className="ml-1">{provider.rating || 'New'}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm mt-1 line-clamp-2">
                                                {provider.location || 'No location specified'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="text-right">
                                            <p className="font-bold">From ₦{provider.starting_price || 'Negotiable'}</p>
                                            <p className="text-xs text-muted-foreground">Est. time: {provider.response_time || '24h'}</p>
                                        </div>
                                        <Button size="sm" onClick={() => handleAssign(provider.id)}>
                                            Hire
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

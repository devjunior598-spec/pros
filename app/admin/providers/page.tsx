"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Briefcase,
    Star,
    CheckCircle,
    XCircle,
    Search,
    Award,
    Settings,
    Loader2,
    MapPin,
    User,
    Plus,
    RefreshCw,
    ShieldCheck
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

type Provider = {
    id: string
    category: string
    experience_years?: number
    rating?: number
    approval_status: "pending" | "approved" | "rejected"
    created_at: string
    user?: { name: string; full_name?: string; email: string; phone_number?: string }
}

export default function AdminProvidersPage() {
    const { toast } = useToast()
    const [providers, setProviders] = useState<Provider[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const fetchProviders = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/providers")
            const data = await res.json()
            setProviders(data.providers || [])
        } catch (error) {
            console.error("Error fetching providers:", error)
            toast({ title: "Fetch Error", description: "Failed to load service providers", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchProviders()
    }, [fetchProviders])

    const handleUpdateStatus = async (providerId: string, approval_status: "approved" | "rejected") => {
        setUpdatingId(providerId)
        try {
            const res = await fetch("/api/admin/providers", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: providerId, approval_status }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to update status")

            toast({ title: "Status Updated", description: data.message })
            setSelectedProvider(null)
            fetchProviders()
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" })
        } finally {
            setUpdatingId(null)
        }
    }

    const filtered = providers.filter((p) => {
        const name = (p.user?.name || p.user?.full_name || "").toLowerCase()
        const trade = (p.category || "").toLowerCase()
        const search = searchTerm.toLowerCase()
        return name.includes(search) || trade.includes(search)
    })

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Service Provider Registry</h1>
                    <p className="text-muted-foreground">Manage professional service accounts, categories, and platform credentials.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchProviders} className="rounded-xl">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search providers by name or trade category..."
                    className="pl-10 rounded-xl bg-white dark:bg-gray-950 border-none shadow-sm h-12 focus:ring-2 ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-muted-foreground italic bg-white dark:bg-gray-950 rounded-2xl p-6">
                        No service providers found.
                    </div>
                ) : (
                    filtered.map((provider) => (
                        <Card key={provider.id} className="border-none shadow-sm bg-white dark:bg-gray-950 overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 relative">
                                        <Briefcase className="h-8 w-8 text-blue-600" />
                                        {provider.approval_status === "approved" && (
                                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-950 rounded-full p-0.5">
                                                <CheckCircle className="h-4 w-4 text-green-500 bg-white dark:bg-gray-900 rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-base leading-tight mb-1">
                                        {provider.user?.name || provider.user?.full_name || "Unnamed Provider"}
                                    </h3>
                                    <Badge variant="secondary" className="mb-4 bg-blue-50 text-blue-700 border-blue-100 capitalize">
                                        {provider.category || "General Service"}
                                    </Badge>

                                    <div className="grid grid-cols-2 w-full gap-4 pt-4 border-t text-sm">
                                        <div className="flex flex-col items-center gap-1">
                                            <Award className="h-4 w-4 text-orange-500" />
                                            <span className="font-bold">{provider.experience_years || 1}y Exp</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <Star className="h-4 w-4 text-yellow-500" />
                                            <span className="font-bold">{provider.rating || 4.8} Rating</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 w-full">
                                        <Button
                                            variant="outline"
                                            onClick={() => setSelectedProvider(provider)}
                                            className="w-full rounded-xl text-xs gap-1"
                                        >
                                            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Review Account
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Verification Dialog */}
            <Dialog open={!!selectedProvider} onOpenChange={(open) => !open && setSelectedProvider(null)}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Provider Credentials</DialogTitle>
                        <DialogDescription>
                            {selectedProvider?.user?.name || selectedProvider?.user?.full_name}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedProvider && (
                        <div className="space-y-4 py-2 text-sm">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-muted/40 rounded-xl">
                                    <span className="text-muted-foreground">Trade Category:</span>
                                    <div className="font-bold text-sm capitalize">{selectedProvider.category}</div>
                                </div>
                                <div className="p-3 bg-muted/40 rounded-xl">
                                    <span className="text-muted-foreground">Status:</span>
                                    <div className="font-bold text-sm capitalize">{selectedProvider.approval_status}</div>
                                </div>
                            </div>

                            <div className="text-xs space-y-1">
                                <div className="text-muted-foreground">Email Address:</div>
                                <div className="font-mono">{selectedProvider.user?.email || "N/A"}</div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            className="rounded-xl text-red-600 border-red-200 hover:bg-red-50 text-xs"
                            disabled={updatingId === selectedProvider?.id}
                            onClick={() => selectedProvider && handleUpdateStatus(selectedProvider.id, "rejected")}
                        >
                            Reject Application
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"
                            disabled={updatingId === selectedProvider?.id}
                            onClick={() => selectedProvider && handleUpdateStatus(selectedProvider.id, "approved")}
                        >
                            Approve Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

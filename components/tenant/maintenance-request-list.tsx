"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MaintenanceRequest } from "@/types/maintenance"
import { Loader2, MessageSquare, ImageIcon, XCircle, X } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface MaintenanceRequestListProps {
    tenantId: string
    refreshKey?: number // Used to trigger refresh
}

export function MaintenanceRequestList({ tenantId, refreshKey }: MaintenanceRequestListProps) {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [cancellingId, setCancellingId] = useState<string | null>(null)

    useEffect(() => {
        const fetchRequests = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('maintenance_requests')
                .select(`
                    *, 
                    rental:rentals(id),
                    images:request_images (
                        id,
                        image_url
                    ),
                    assignments:repair_assignments(
                        status,
                        provider:service_providers(full_name, phone, category)
                    )
                `)
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error("Error fetching maintenance requests:", error)
                console.error("Error details:", JSON.stringify(error, null, 2))
            } else {
                setRequests(data || [])
            }
            setLoading(false)
        }

        fetchRequests()
    }, [tenantId, refreshKey])

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>

    if (requests.length === 0) {
        return (
            <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                No maintenance requests found.
            </div>
        )
    }

    const cancelRequest = async (requestId: string) => {
        if (!confirm("Are you sure you want to cancel this request?")) return

        setCancellingId(requestId)
        const { error } = await supabase
            .from('maintenance_requests')
            .update({ status: 'cancelled' })
            .eq('id', requestId)
            .eq('tenant_id', tenantId)

        setCancellingId(null)

        if (error) {
            console.error("Error cancelling request:", error)
            alert("Failed to cancel request.")
        } else {
            setRequests(requests.map(req =>
                req.id === requestId ? { ...req, status: 'cancelled' } : req
            ))
        }
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'completed': return 'default'
            case 'in_progress': return 'secondary'
            case 'cancelled': return 'destructive'
            default: return 'outline'
        }
    }

    return (
        <div className="space-y-4">
            {requests.map((request) => (
                <Card key={request.id}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-base">{request.title}</CardTitle>
                                <CardDescription className="text-xs">
                                    {new Date(request.created_at).toLocaleDateString()}
                                </CardDescription>
                            </div>
                            <Badge variant={getStatusVariant(request.status) as any}>
                                {request.status.replace('_', ' ')}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm">{request.description}</p>

                        {request.images && request.images.length > 0 && (
                            <div className="mb-4">
                                <div className="text-xs font-semibold mb-2 flex items-center gap-1 text-muted-foreground uppercase">
                                    <ImageIcon className="h-3 w-3" /> Images
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {request.images.map((img: any) => (
                                        <div
                                            key={img.id}
                                            className="relative h-20 w-20 rounded-md overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => setSelectedImage(img.image_url)}
                                        >
                                            <img
                                                src={img.image_url}
                                                alt="Maintenance"
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Display Assigned Provider Info */}
                        {request.assignments && request.assignments.length > 0 && request.assignments[0].provider && (
                            <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-md text-sm">
                                <h4 className="font-semibold text-blue-800 mb-1 text-xs uppercase tracking-wider">Assigned Professional</h4>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <p className="font-medium text-gray-900">{request.assignments[0].provider.full_name}</p>
                                        <p className="text-gray-500 text-xs">{request.assignments[0].provider.category}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-white">
                                            {request.assignments[0].status.replace('_', ' ')}
                                        </Badge>
                                        {request.assignments[0].provider.phone && (
                                            <a href={`tel:${request.assignments[0].provider.phone}`} className="text-blue-600 hover:underline text-xs bg-white border px-2 py-1 rounded">
                                                Call: {request.assignments[0].provider.phone}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center mt-4">
                            <div className="text-xs text-muted-foreground">
                                Priority: <span className="capitalize font-medium">{request.priority}</span>
                            </div>
                            <div className="flex gap-2">
                                {request.status === 'pending' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10 border-destructive/20"
                                        onClick={() => cancelRequest(request.id)}
                                        disabled={cancellingId === request.id}
                                    >
                                        {cancellingId === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                        Cancel Request
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/dashboard?tab=Chat&rentalId=${request.rental_id}`}>
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Message Landlord
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none">
                    <div className="relative flex items-center justify-center p-4 min-h-[50vh]">
                        <button
                            className="absolute top-4 right-4 z-50 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="h-5 w-5" />
                        </button>
                        {selectedImage && (
                            <img
                                src={selectedImage}
                                alt="Maintenance Large View"
                                className="max-h-[85vh] max-w-full object-contain shadow-2xl"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

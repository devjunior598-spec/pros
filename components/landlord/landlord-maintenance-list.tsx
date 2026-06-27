"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MaintenanceRequest, MaintenanceStatus } from "@/types/maintenance"
import { Loader2, CheckCircle, Clock, MessageSquare, ImageIcon, X, UserPlus, Star, Wrench } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"

import { ServiceProviderMarketplace } from "./service-provider-marketplace"
import { ReviewModal } from "./review-modal"

interface LandlordMaintenanceListProps {
    landlordId: string
    limit?: number
}

export function LandlordMaintenanceList({ landlordId, limit }: LandlordMaintenanceListProps) {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false)
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null)

    const fetchRequests = useCallback(async (signal?: AbortSignal) => {
        setLoading(true)
        try {
            // Fetch maintenance requests for properties owned by this landlord
            let query = supabase
                .from('maintenance_requests')
                .select(`
                    *,
                    rental:rentals!inner (
                        property:properties!inner (
                            title,
                            landlord_id
                        )
                    ),
                    tenant:profiles (
                        name
                    ),
                    images:request_images (
                        id,
                        image_url
                    ),
                    assignments:repair_assignments (
                        *,
                        provider:service_providers (*)
                    ),
                    quotes:repair_quotes (
                        id
                    ),
                    reviews:reviews (
                        id
                    )
                `)
                .eq('rental.property.landlord_id', landlordId)
                .order('created_at', { ascending: false })

            if (limit) {
                query = query.limit(limit)
            }

            if (signal) {
                query = query.abortSignal(signal)
            }

            const { data, error } = await query

            if (error) {
                if (!signal?.aborted) {
                    console.error("Error fetching landlord maintenance requests:", error)
                }
            } else if (!signal?.aborted) {
                setRequests(data || [])
            }
        } catch (error: any) {
            if (error.name === 'AbortError' || error.message?.includes('aborted')) return
            console.error("Fetch request failed:", error)
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }, [landlordId, limit])

    useEffect(() => {
        const controller = new AbortController()
        if (landlordId) {
            fetchRequests(controller.signal)
        }
        return () => controller.abort()
    }, [landlordId, fetchRequests])

    const updateStatus = async (requestId: string, newStatus: MaintenanceStatus) => {
        const { error } = await supabase
            .from('maintenance_requests')
            .update({ status: newStatus })
            .eq('id', requestId)

        if (error) {
            console.error("Error updating request status:", error)
            alert("Failed to update status")
        } else {
            // Also update any linked repair assignments to completed if the request is completed
            if (newStatus === 'completed') {
                const { error: assignmentError } = await supabase
                    .from('repair_assignments')
                    .update({ status: 'completed' })
                    .eq('request_id', requestId)

                if (assignmentError) {
                    console.error("Error updating repair assignment status:", assignmentError)
                }
            }
            fetchRequests()
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    if (requests.length === 0) {
        return (
            <EmptyState
                icon={Wrench}
                title="No Maintenance Requests"
                description="Your properties are in great shape! No maintenance requests have been reported."
            />
        )
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
            <h3 className="text-xl font-semibold mb-4">Maintenance Requests</h3>
            <div className="grid gap-4">
                {requests.map((request) => (
                    <Card key={request.id}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <CardTitle className="text-lg">{request.title}</CardTitle>
                                        <Badge variant={getStatusVariant(request.status) as any}>
                                            {request.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        Property: <span className="font-medium text-foreground">{request.rental?.property?.title}</span> |
                                        Tenant: <span className="font-medium text-foreground">{request.tenant?.name}</span>
                                    </CardDescription>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(request.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm mb-4">{request.description}</p>

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

                            <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                        Priority: <span className={
                                            request.priority === 'emergency' ? 'text-destructive' :
                                                request.priority === 'high' ? 'text-orange-500' : 'text-blue-500'
                                        }>{request.priority}</span>
                                    </div>
                                    {request.category && (
                                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                            Category: <span className="text-foreground">{request.category}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex space-x-2">
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={`/dashboard?tab=Chat&rentalId=${request.rental_id}`}>
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            Message
                                        </Link>
                                    </Button>
                                    {request.status === 'pending' && (
                                        <Button size="sm" variant="outline" onClick={() => updateStatus(request.id, 'in_progress')}>
                                            <Clock className="mr-2 h-4 w-4" />
                                            Progress
                                        </Button>
                                    )}

                                    {/* Assignment Actions */}
                                    {(!request.assignments || request.assignments.length === 0) ? (
                                        <div className="flex gap-2">
                                            {request.quotes && request.quotes.length > 0 && (
                                                <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                                                    {request.quotes.length} Quotes
                                                </Badge>
                                            )}
                                            <Button
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700"
                                                onClick={() => {
                                                    setSelectedRequest(request)
                                                    setIsMarketplaceOpen(true)
                                                }}
                                            >
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Find Provider
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                                                Assigned: {request.assignments[0]?.provider?.full_name}
                                            </Badge>
                                            {request.assignments[0]?.status !== 'completed' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 px-2 text-xs text-blue-600"
                                                    onClick={() => updateStatus(request.id, 'completed')}
                                                >
                                                    Mark Completed
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {request.status === 'completed' && request.assignments && request.assignments.length > 0 && (!request.reviews || request.reviews.length === 0) && (
                                        <Button
                                            size="sm"
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                            onClick={() => {
                                                setSelectedRequest(request)
                                                setIsReviewModalOpen(true)
                                            }}
                                        >
                                            <Star className="mr-2 h-4 w-4" />
                                            Leave Review
                                        </Button>
                                    )}

                                    {request.status === 'completed' && request.reviews && request.reviews.length > 0 && (
                                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                                            <CheckCircle className="mr-1 h-3 w-3" /> Reviewed
                                        </Badge>
                                    )}

                                    {request.status !== 'completed' && (!request.assignments || request.assignments[0]?.status === 'completed') && (
                                        <Button size="sm" onClick={() => updateStatus(request.id, 'completed')}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Complete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {selectedRequest && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onOpenChange={setIsReviewModalOpen}
                    requestId={selectedRequest.id}
                    providerId={selectedRequest.assignments?.[0]?.provider_id}
                    landlordId={landlordId}
                    onReviewSubmitted={() => fetchRequests()}
                />
            )}

            <ServiceProviderMarketplace
                isOpen={isMarketplaceOpen}
                onOpenChange={setIsMarketplaceOpen}
                request={selectedRequest}
                onAssign={() => fetchRequests()}
            />

            {/* Lightbox / Image Enlarge Dialog */}
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

"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, User, Phone, Mail, Home, Calendar, Activity } from "lucide-react"
import { RentalStatus } from "@/types"

interface LandlordApplicationsListProps {
    landlordId: string
}

interface ApplicationRecord {
    id: string
    property_id: string
    rent_amount: number | null
    rent_start_date: string | null
    created_at: string
    status: string
    notes: string | null
    employment: string | null
    income: string | null
    property?: {
        title: string | null
        address: string | null
        landlord_id: string | null
    }
    tenant?: {
        name: string | null
        full_name: string | null
        email: string | null
        phone: string | null
    }
}

export function LandlordApplicationsList({ landlordId }: LandlordApplicationsListProps) {
    const [applications, setApplications] = useState<ApplicationRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const fetchApplications = useCallback(async (signal?: AbortSignal) => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('rentals')
                .select(`
                    *,
                    property:properties!property_id (
                        id,
                        title,
                        address,
                        landlord_id
                    ),
                    tenant:profiles!rentals_tenant_id_fkey (
                        name,
                        full_name,
                        email,
                        phone
                    )
                `)
                .eq('property.landlord_id', landlordId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (error) {
                if (!signal?.aborted) {
                    console.error("Error fetching applications for landlord:", landlordId)
                    console.error("Error fetching applications object:", error)
                }
            } else if (!signal?.aborted) {
                setApplications((data as ApplicationRecord[] | null) || [])
            }
        } catch (error: unknown) {
            if (!signal?.aborted) {
                console.error("Error in fetchApplications:", error)
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }, [landlordId])

    useEffect(() => {
        let mounted = true
        if (landlordId) {
            fetchApplications()
        }
        return () => mounted = false
    }, [fetchApplications, landlordId])

    const handleAction = async (requestId: string, propertyId: string, status: RentalStatus) => {
        setActionLoading(requestId)

        try {
            // 1. Update Rental Status
            const { error: rentalError } = await supabase
                .from('rentals')
                .update({ status })
                .eq('id', requestId)

            if (rentalError) throw rentalError

            // 2. If approved, update property status to 'rented' and CREATE INITIAL BILL
            if (status === 'approved') {
                const { error: propertyError } = await supabase
                    .from('properties')
                    .update({ status: 'rented' })
                    .eq('id', propertyId)

                if (propertyError) throw propertyError

                // Find the specific application to get details for the bill
                const app = applications.find(a => a.id === requestId)

                // Create the initial rent bill
                const { error: billError } = await supabase
                    .from('bills')
                    .insert({
                        rental_id: requestId,
                        type: 'rent',
                        amount: app?.rent_amount || 0,
                        due_date: app?.rent_start_date || new Date().toISOString().split('T')[0],
                        status: 'unpaid'
                    })

                if (billError) {
                    console.error("Failed to create automated bill:", billError)
                    // We don't throw here to avoid rolling back the whole approval, 
                    // but it's a significant error to log.
                }
            }

            // 3. Refresh list
            await fetchApplications()
        } catch (error: unknown) {
            console.error(`Error during application ${status}:`, error)
            alert(`Failed to ${status} application.`)
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    if (applications.length === 0) {
        return (
            <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground bg-muted/20">
                <Home className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No pending applications</h3>
                <p>New rental applications from tenants will appear here.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Pending Applications ({applications.length})</h3>
            <div className="grid gap-6">
                {applications.map((app) => (
                    <Card key={app.id} className="overflow-hidden border-l-4 border-l-primary">
                        <CardHeader className="bg-muted/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <CardTitle className="text-lg">{app.property?.title}</CardTitle>
                                        <Badge>₦{app.rent_amount?.toLocaleString()}/mo</Badge>
                                    </div>
                                    <CardDescription className="flex items-center mt-1">
                                        <Home className="h-3 w-3 mr-1" />
                                        {app.property?.address}
                                    </CardDescription>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Received: {new Date(app.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center">
                                        <User className="h-4 w-4 mr-2" />
                                        Applicant Details
                                    </h4>
                                    <div className="space-y-1">
                                        <p className="text-base font-medium">{app.tenant?.full_name || app.tenant?.name}</p>
                                        <p className="text-sm flex items-center text-muted-foreground">
                                            <Mail className="h-3 w-3 mr-2" />
                                            {app.tenant?.email}
                                        </p>
                                        {app.tenant?.phone && (
                                            <p className="text-sm flex items-center text-muted-foreground">
                                                <Phone className="h-3 w-3 mr-2" />
                                                {app.tenant?.phone}
                                            </p>
                                        )}
                                    </div>

                                    {/* Application Details */}
                                    <div className="pt-2 grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Move-in Date</p>
                                            <p className="text-sm font-semibold flex items-center">
                                                <Calendar className="h-3 w-3 mr-2 text-primary" />
                                                {app.rent_start_date ? new Date(app.rent_start_date).toLocaleDateString() : 'Immediate'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Income (Annual)</p>
                                            <p className="text-sm font-semibold flex items-center text-green-600">
                                                ₦{app.income || 'Not specified'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1 pt-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Employment</p>
                                        <p className="text-sm font-medium italic">
                                            {app.employment || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center">
                                        <Activity className="h-4 w-4 mr-2" />
                                        Application Notes
                                    </h4>
                                    <div className="p-3 bg-muted/50 rounded-lg text-sm text-balance leading-relaxed min-h-[60px]">
                                        {app.notes || "The tenant didn't provide any additional notes."}
                                    </div>
                                    <div className="flex space-x-3">
                                        <Button
                                            variant="outline"
                                            className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                                            disabled={actionLoading === app.id}
                                            onClick={() => handleAction(app.id, app.property_id, 'rejected')}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Reject
                                        </Button>
                                        <Button
                                            disabled={actionLoading === app.id}
                                            onClick={() => handleAction(app.id, app.property_id, 'approved')}
                                        >
                                            {actionLoading === app.id ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                            )}
                                            Approve Applicant
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground italic">
                                        Approving will mark the property as rented and notify the tenant.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

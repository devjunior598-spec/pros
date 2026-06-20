"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, MapPin, Phone, User, CheckCircle2, AlertCircle } from "lucide-react"

interface ActiveAssignmentsProps {
    providerId: string
}

export function ActiveAssignments({ providerId }: ActiveAssignmentsProps) {
    const [assignments, setAssignments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)

    const fetchAssignments = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('repair_assignments')
                .select(`
                    id, 
                    status, 
                    agreed_price, 
                    created_at,
                    request:maintenance_requests (
                        id, title, description, priority, location_city, location_state,
                        tenant:profiles!maintenance_requests_tenant_id_fkey(name, phone)
                    )
                `)
                .eq('provider_id', providerId)
                .in('status', ['assigned', 'in_progress'])
                .order('created_at', { ascending: false })

            if (error) throw error
            setAssignments(data || [])
        } catch (error) {
            console.error("Error fetching assignments:", error)
        } finally {
            setLoading(false)
        }
    }, [providerId])

    useEffect(() => {
        if (providerId) {
            fetchAssignments()
        }
    }, [fetchAssignments, providerId])

    const handleUpdateStatus = async (assignmentId: string, requestId: string, newStatus: string) => {
        setUpdating(assignmentId)
        try {
            // Update assignment status
            const { error: assignError } = await supabase
                .from('repair_assignments')
                .update({ status: newStatus })
                .eq('id', assignmentId)

            if (assignError) throw assignError

            // Sync request status
            const requestStatus = newStatus === 'in_progress' ? 'in_progress' : 'resolved'

            const { error: reqError } = await supabase
                .from('maintenance_requests')
                .update({ status: requestStatus })
                .eq('id', requestId)

            if (reqError) throw reqError

            alert(`Marked as ${newStatus.replace('_', ' ')}!`)
            fetchAssignments()
        } catch (error: any) {
            console.error("Error updating status:", error)
            alert("Failed to update status")
        } finally {
            setUpdating(null)
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

    if (assignments.length === 0) {
        return (
            <Card className="border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mb-4 opacity-50" />
                    <p>No active assignments at the moment.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {assignments.map(assignment => (
                <Card key={assignment.id} className="border-blue-100 bg-blue-50/10">
                    <CardHeader className="pb-3 border-b border-blue-100/50">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl text-blue-900">{assignment.request?.title}</CardTitle>
                                <CardDescription className="flex items-center gap-1 mt-1 text-blue-700/70">
                                    <MapPin className="h-3 w-3" />
                                    {assignment.request?.location_city}, {assignment.request?.location_state}
                                </CardDescription>
                            </div>
                            <Badge className={
                                assignment.status === 'in_progress' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600'
                            }>
                                {assignment.status.replace('_', ' ')}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Job Details</h4>
                            <p className="text-sm text-foreground bg-white p-3 rounded border shadow-sm">
                                {assignment.request?.description}
                            </p>
                            <p className="font-bold text-lg text-blue-700 mt-2">
                                Agreed Price: ₦{assignment.agreed_price?.toLocaleString() || 'N/A'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Info</h4>
                            <div className="bg-white p-3 rounded border shadow-sm space-y-3">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-500" />
                                    <span className="font-medium">{assignment.request?.tenant?.name || 'Unknown Tenant'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-green-600" />
                                    <a href={`tel:${assignment.request?.tenant?.phone}`} className="text-blue-600 hover:underline">
                                        {assignment.request?.tenant?.phone || 'No phone provided'}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/10 pt-4 flex justify-end gap-3">
                        {assignment.status === 'assigned' && (
                            <Button
                                variant="outline"
                                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                                onClick={() => handleUpdateStatus(assignment.id, assignment.request?.id, 'in_progress')}
                                disabled={!!updating}
                            >
                                {updating === assignment.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Start Job
                            </Button>
                        )}

                        {assignment.status === 'in_progress' && (
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleUpdateStatus(assignment.id, assignment.request?.id, 'completed')}
                                disabled={!!updating}
                            >
                                {updating === assignment.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Mark Completed
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

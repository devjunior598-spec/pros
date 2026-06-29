"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Briefcase,
    MapPin,
    Clock,
    CheckCircle2,
    PlayCircle,
    ChevronRight,
    Loader2,
    Calendar,
    User,
    MessageSquare
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function AssignedJobsPage() {
    const [assignments, setAssignments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [provider, setProvider] = useState<any>(null)

    useEffect(() => {
        let mounted = true
        const fetchAssignments = async (signal: AbortSignal) => {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user && !signal.aborted) {
                    const { data: providerData } = await supabase
                        .from('service_providers')
                        .select('*')
                        .eq('user_id', user.id)
                        .single()

                    if (!signal.aborted) {
                        setProvider(providerData)
                    }

                    if (providerData && !signal.aborted) {
                        const { data, error } = await supabase
                            .from('repair_assignments')
                            .select(`
                                *,
                                request:maintenance_requests (
                                    id,
                                    title,
                                    description,
                                    priority,
                                    created_at,
                                    status,
                                    tenant:profiles(name),
                                    property:properties(title, city, state, landlord:profiles(name))
                                )
                            `)
                            .eq('provider_id', providerData.id)
                            .order('created_at', { ascending: false })

                        if (error && !signal.aborted) throw error
                        if (!signal.aborted) {
                            setAssignments(data || [])
                        }
                    }
                }
            } catch (error) {
                if (signal.aborted) return
                console.error("Error fetching assignments:", error)
            } finally {
                if (!signal.aborted) {
                    setLoading(false)
                }
            }
        }
        fetchAssignments()
        return () => mounted = false
    }, [])

    const updateJobStatus = async (assignmentId: string, requestId: string, newStatus: string) => {
        try {
            // Update assignment status
            const { error: assignmentError } = await supabase
                .from('repair_assignments')
                .update({ status: newStatus })
                .eq('id', assignmentId)

            if (assignmentError) throw assignmentError

            // Update maintenance request status accordingly
            const requestStatus = newStatus === 'completed' ? 'resolved' : 'in_progress'
            const { error: requestError } = await supabase
                .from('maintenance_requests')
                .update({ status: requestStatus })
                .eq('id', requestId)

            if (requestError) throw requestError

            // Refresh list
            setAssignments(prev => prev.map(a =>
                a.id === assignmentId ? { ...a, status: newStatus } : a
            ))
            alert(`Job status updated to ${newStatus}`)
        } catch (error: any) {
            console.error("Error updating status:", error)
            alert(error.message || "Failed to update status")
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">My Assigned Jobs</h1>
                <p className="text-muted-foreground">Manage and track the repairs you are currently working on.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : assignments.length === 0 ? (
                <Card className="p-20 text-center border-dashed">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                    <h3 className="text-xl font-semibold">No assigned jobs yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                        Browse the Available Jobs marketplace to find work and submit your bids.
                    </p>
                    <Link href="/maintenance/available" className="mt-6 inline-block">
                        <Button className="bg-blue-600 hover:bg-blue-700">Explore Marketplace</Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {assignments.map((job) => (
                        <Card key={job.id} className="overflow-hidden border-none shadow-sm bg-white dark:bg-gray-950">
                            <div className="flex flex-col md:flex-row h-full">
                                <div className="p-6 flex-1 space-y-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-bold">{job.request?.title}</h3>
                                                <Badge variant={
                                                    job.status === 'completed' ? 'secondary' :
                                                        job.status === 'in_progress' ? 'default' : 'outline'
                                                } className="bg-blue-50 text-blue-700 border-blue-200">
                                                    {job.status}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground flex items-center gap-1 text-sm">
                                                <MapPin className="h-4 w-4" />
                                                {job.request?.property?.title} — {job.request?.property?.city}, {job.request?.property?.state}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                ₦{job.agreed_price?.toLocaleString() || 'Quote Pending'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Assigned {new Date(job.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Landlord</Label>
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-4 w-4 text-gray-400" />
                                                {job.request?.property?.landlord?.name}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Tenant</Label>
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-4 w-4 text-gray-400" />
                                                {job.request?.tenant?.name}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Priority</Label>
                                            <div className="text-sm">
                                                <Badge variant="outline" className="h-5 text-[10px]">{job.request?.priority}</Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Reported</Label>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {new Date(job.request?.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                                            "{job.request?.description}"
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-50/50 dark:bg-gray-900/30 p-6 md:w-64 border-l flex flex-col justify-center gap-3">
                                    {job.status === 'assigned' && (
                                        <Button
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                            onClick={() => updateJobStatus(job.id, job.request.id, 'in_progress')}
                                        >
                                            <PlayCircle className="h-4 w-4 mr-2" /> Start Job
                                        </Button>
                                    )}
                                    {job.status === 'in_progress' && (
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => updateJobStatus(job.id, job.request.id, 'completed')}
                                        >
                                            <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Completed
                                        </Button>
                                    )}
                                    {job.status === 'completed' && (
                                        <div className="text-center p-4">
                                            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                                            <p className="text-sm font-semibold text-green-600">Job Completed</p>
                                        </div>
                                    )}
                                    <Link href={`/messages?provider=${job.id}`}>
                                        <Button variant="outline" className="w-full">
                                            <MessageSquare className="h-4 w-4 mr-2" /> Chat
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

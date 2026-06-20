
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, FileText, Home, User } from "lucide-react"
import Link from "next/link"
import { MaintenanceStatusTimeline } from "@/components/maintenance/maintenance-status-timeline"
import { MaintenanceCostManagement } from "@/components/maintenance/maintenance-cost-management"
import { MaintenanceChat } from "@/components/maintenance/maintenance-chat"
import { MaintenanceRequest } from "@/types/maintenance"

export default function TenantMaintenanceDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const requestId = params.id as string

    const [request, setRequest] = useState<MaintenanceRequest | null>(null)
    const [logs, setLogs] = useState<any[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setCurrentUser(user)

            // Fetch request details
            const { data: req, error } = await supabase
                .from('maintenance_requests')
                .select(`
                    *,
                    property:properties (
                        title,
                        address
                    ),
                    tenant:profiles (
                        name,
                        email
                    ),
                    assignments:repair_assignments (
                        *,
                        provider:service_providers (
                            *,
                            provider:profiles!service_providers_user_id_fkey(*)
                        )
                    )
                `)
                .eq('id', requestId)
                .single()

            if (error) {
                console.error('Error fetching request:', error)
            } else {
                setRequest(req)
            }

            // Fetch logs
            const { data: statusLogs } = await supabase
                .from('maintenance_status_logs')
                .select('*')
                .eq('request_id', requestId)
                .order('created_at', { ascending: false })

            setLogs(statusLogs || [])
            setLoading(false)
        }

        fetchData()
    }, [requestId, router])

    if (loading) return <div className="p-8">Loading...</div>
    if (!request) return <div className="p-8">Request not found</div>

    const assignedProvider = request.assignments?.[0]?.provider

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/tenant/maintenance">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{request.title}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="outline">{request.status}</Badge>
                        <span>•</span>
                        <span className="capitalize">{request.priority} Priority</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <div className="col-span-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Issue Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Home className="h-4 w-4" /> Property
                                    </span>
                                    <p>{request.property?.title}</p>
                                    <p className="text-xs text-muted-foreground">{request.property?.address}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <User className="h-4 w-4" /> Tenant
                                    </span>
                                    <p>{request.tenant?.name}</p>
                                    {/* <p className="text-xs text-muted-foreground">{request.tenant?.email}</p> */}
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> Reported Date
                                    </span>
                                    <p>{new Date(request.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Category
                                    </span>
                                    <p className="capitalize">{request.category || 'General'}</p>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="font-semibold mb-2">Description</h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {request.description}
                                </p>
                            </div>

                            {assignedProvider && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="font-semibold mb-2">Assigned Provider</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold">
                                                {(assignedProvider.provider?.full_name || assignedProvider.provider?.name || '?')[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium">{assignedProvider.provider?.full_name || assignedProvider.provider?.name}</p>
                                                <p className="text-xs text-muted-foreground">{assignedProvider.category}</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="timeline">
                        <TabsList>
                            <TabsTrigger value="timeline">Timeline</TabsTrigger>
                            <TabsTrigger value="chat">Communication</TabsTrigger>
                        </TabsList>
                        <TabsContent value="timeline" className="mt-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <MaintenanceStatusTimeline
                                        currentStatus={request.status}
                                        logs={logs}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="chat" className="mt-4">
                            <MaintenanceChat
                                requestId={request.id}
                                currentUserId={currentUser.id}
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="col-span-3 space-y-4">
                    <MaintenanceCostManagement
                        requestId={request.id}
                        initialEstimatedCost={request.estimated_cost}
                        initialFinalCost={request.final_cost}
                        isLandlord={false} // Force read-only for tenant
                    />
                </div>
            </div>
        </div>
    )
}

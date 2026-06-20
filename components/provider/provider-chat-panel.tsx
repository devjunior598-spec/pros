"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MaintenanceChat } from "@/components/maintenance/maintenance-chat"
import { Wrench } from "lucide-react"

interface ProviderChatPanelProps {
    providerId: string // The auth.users.id
}

interface Assignment {
    id: string
    request_id: string
    status: string
    request: {
        id: string
        title: string
        property: {
            title: string
        } | null
    } | null
}

export function ProviderChatPanel({ providerId }: ProviderChatPanelProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    const searchParams = useSearchParams()
    const targetRequestId = searchParams.get('requestId')

    useEffect(() => {
        const fetchAssignments = async () => {
            // First we need the actual service_provider row ID of this user
            const { data: providerData, error: providerError } = await supabase
                .from('service_providers')
                .select('id')
                .eq('user_id', providerId)
                .single()

            if (providerError || !providerData) {
                console.error("Error fetching provider profile:", providerError)
                setLoading(false)
                return
            }

            // Now fetch assignments
            const { data, error } = await supabase
                .from('repair_assignments')
                .select(`
                    id,
                    request_id,
                    status,
                    request:maintenance_requests (
                        id,
                        title,
                        property:properties(title)
                    )
                `)
                .eq('provider_id', providerData.id)
                .in('status', ['assigned', 'in_progress', 'completed']) // Show active and historical chats

            if (error) {
                console.error("Error fetching assignments:", error)
            } else {
                setAssignments(data as unknown as Assignment[])
            }
            setLoading(false)
        }

        fetchAssignments()
    }, [providerId])

    useEffect(() => {
        if (assignments.length > 0) {
            if (targetRequestId) {
                const target = assignments.find(a => a.request_id === targetRequestId)
                if (target) {
                    setSelectedRequest(target.request_id)
                    return
                }
            }
            if (!selectedRequest) {
                setSelectedRequest(assignments[0].request_id)
            }
        }
    }, [assignments, targetRequestId, selectedRequest])

    return (
        <div className="flex h-[calc(100vh-12rem)] min-h-[500px] gap-4">
            {/* Sidebar for Conversations */}
            <Card className="w-1/3 flex flex-col h-full">
                <CardHeader className="py-4 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-blue-600" /> Job Chats
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full">
                        <div className="flex flex-col">
                            {loading ? (
                                <div className="p-4 text-sm text-muted-foreground">Loading jobs...</div>
                            ) : assignments.length === 0 ? (
                                <div className="p-4 text-sm text-muted-foreground text-center py-8">
                                    No assigned jobs yet.
                                </div>
                            ) : (
                                assignments.map((a) => (
                                    <button
                                        key={a.id}
                                        onClick={() => setSelectedRequest(a.request_id)}
                                        className={`p-4 text-left hover:bg-muted transition-colors border-b flex flex-col gap-1 ${selectedRequest === a.request_id ? 'bg-muted border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'
                                            }`}
                                    >
                                        <div className="font-semibold text-sm leading-tight text-foreground truncate">
                                            {a.request?.title || 'Unknown Job'}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {a.request?.property?.title || 'General Maintenance'}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {selectedRequest ? (
                    <MaintenanceChat
                        requestId={selectedRequest}
                        currentUserId={providerId}
                    />
                ) : (
                    <Card className="h-full border flex flex-col items-center justify-center text-muted-foreground bg-slate-50/50">
                        <div className="bg-white shadow-sm w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                            <span className="text-2xl">💬</span>
                        </div>
                        <h3 className="text-lg font-medium text-foreground">Maintenance Inbox</h3>
                        <p className="text-sm max-w-[250px] text-center mt-1">Select an assigned job on the left to discuss details with the landlord or tenant.</p>
                    </Card>
                )}
            </div>
        </div>
    )
}

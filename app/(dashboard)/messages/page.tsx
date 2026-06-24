"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { ChatPanel } from "@/components/landlord/chat-panel"
import { TenantChatPanel } from "@/components/tenant/tenant-chat-panel"
import { ProviderChatPanel } from "@/components/provider/provider-chat-panel"
import { Loader2, MessageSquare } from "lucide-react"

export default function MessagesPage() {
    const [user, setUser] = useState<{ id: string; role: string } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const controller = new AbortController()
        const fetchUser = async (signal: AbortSignal) => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser()
                if (authUser && !signal.aborted) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', authUser.id)
                        .abortSignal(signal)
                        .single()

                    if (profile && !signal.aborted) {
                        setUser({ id: authUser.id, role: profile.role })
                    }
                }
            } catch (error) {
                if (!signal.aborted) console.error("Error fetching user for messages:", error)
            } finally {
                if (!signal.aborted) setLoading(false)
            }
        }
        fetchUser(controller.signal)
        return () => controller.abort()
    }, [])

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-muted-foreground">Loading messages…</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Please log in to view messages.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Messages</h1>
                    <p className="text-muted-foreground text-sm">Chat with your tenants, landlords, and service providers.</p>
                </div>
            </div>

            {user.role === 'landlord' ? (
                <ChatPanel landlordId={user.id} />
            ) : user.role === 'service_provider' ? (
                <ProviderChatPanel providerId={user.id} />
            ) : (
                <TenantChatPanel tenantId={user.id} />
            )}
        </div>
    )
}

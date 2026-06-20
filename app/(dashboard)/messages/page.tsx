"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { ChatPanel } from "@/components/landlord/chat-panel"
import { TenantChatPanel } from "@/components/tenant/tenant-chat-panel"
import { ProviderChatPanel } from "@/components/provider/provider-chat-panel"

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
                if (!signal.aborted) {
                    console.error("Error fetching user for messages:", error)
                }
            } finally {
                if (!signal.aborted) {
                    setLoading(false)
                }
            }
        }
        fetchUser(controller.signal)
        return () => controller.abort()
    }, [])

    if (loading) return <div>Loading...</div>
    if (!user) return <div>Please log in to view messages.</div>

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
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

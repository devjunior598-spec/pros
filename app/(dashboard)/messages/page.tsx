"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { ChatPanel } from "@/components/landlord/chat-panel"
import { TenantChatPanel } from "@/components/tenant/tenant-chat-panel"
import { ProviderChatPanel } from "@/components/provider/provider-chat-panel"
import { PageHeader } from "@/components/page-header"
import { Loader2, MessageSquare } from "lucide-react"

export default function MessagesPage() {
    const [user, setUser] = useState<{ id: string; role: string } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const fetchUser = async (signal: AbortSignal) => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser()
                if (authUser && !signal.aborted) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', authUser.id)
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
        fetchUser()
        return () => mounted = false
    }, [])

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading messages…</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="text-center">
                    <MessageSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Please log in to view messages.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <PageHeader
                title="Messages"
                description="Chat with your tenants, landlords, and service providers."
                icon={MessageSquare}
            />

            <div className="rounded-xl border border-border bg-white p-2 shadow-sm">
                {user.role === 'landlord' ? (
                    <ChatPanel landlordId={user.id} />
                ) : user.role === 'service_provider' ? (
                    <ProviderChatPanel providerId={user.id} />
                ) : (
                    <TenantChatPanel tenantId={user.id} />
                )}
            </div>
        </div>
    )
}

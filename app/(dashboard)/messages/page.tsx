"use client"

import { ProviderChatPanel } from "@/components/provider/provider-chat-panel"
import { LandlordTenantChatPanel } from "@/components/chat/landlord-tenant-chat-panel"
import { PageHeader } from "@/components/page-header"
import { Loader2, MessageSquare } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function MessagesPage() {
    const { user, profile, loading } = useAuth()

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
                {profile?.role === 'service_provider' ? (
                    <ProviderChatPanel providerId={user.id} />
                ) : (
                    <LandlordTenantChatPanel currentUserId={user.id} />
                )}
            </div>
        </div>
    )
}

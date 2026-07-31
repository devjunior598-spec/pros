"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Search, MessageSquare, ShieldCheck, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageWindow } from "@/components/chat/message-window"

type Conversation = {
    id: string; rental_id: string; landlord_id: string; tenant_id: string; created_at: string
    otherUser: { id: string; name: string; isVerified: boolean; avatarUrl: string | null }
    property: { id: string; title: string; address: string | null } | null
    lastMessage: { message: string; type: string; created_at: string } | null
    unreadCount: number
}

export function LandlordTenantChatPanel({ currentUserId }: { currentUserId: string }) {
    const searchParams = useSearchParams()
    const targetConversationId = searchParams.get("convId")
    const targetRentalId = searchParams.get("rentalId")
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [showChat, setShowChat] = useState(false)

    const fetchConversations = useCallback(async () => {
        try {
            const response = await fetch("/api/messages/conversations", { cache: "no-store" })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || "Failed to load conversations")
            setConversations(result.conversations || [])
            setError("")
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Failed to load conversations")
        } finally { setLoading(false) }
    }, [])

    useEffect(() => {
        fetchConversations()
        const channel = supabase.channel(`conversation-list:${currentUserId}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, fetchConversations)
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [currentUserId, fetchConversations])

    useEffect(() => {
        if (conversations.length === 0) return
        const requested = conversations.find((conversation) => conversation.id === targetConversationId || conversation.rental_id === targetRentalId)
        setSelectedId(requested?.id || selectedId || conversations[0].id)
        if (requested) setShowChat(true)
    }, [conversations, selectedId, targetConversationId, targetRentalId])

    const filteredConversations = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return conversations
        return conversations.filter((conversation) => conversation.otherUser.name.toLowerCase().includes(query) || conversation.property?.title.toLowerCase().includes(query) || conversation.property?.address?.toLowerCase().includes(query))
    }, [conversations, search])
    const selectedConversation = conversations.find((conversation) => conversation.id === selectedId) || null

    return (
        <div className="grid h-[calc(100vh-12rem)] min-h-[520px] grid-cols-1 gap-0 md:grid-cols-3 md:gap-4">
            <Card className={`${showChat ? "hidden" : "flex"} h-full min-w-0 flex-col overflow-hidden md:col-span-1 md:flex`}>
                <CardHeader className="space-y-3 border-b p-4">
                    <div className="flex items-center justify-between"><CardTitle className="text-lg">Conversations</CardTitle><Badge variant="secondary">{conversations.reduce((count, item) => count + item.unreadCount, 0)} unread</Badge></div>
                    <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people or properties" className="pl-9" /></div>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 p-0"><ScrollArea className="h-full">
                    {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : error ? <div className="p-6 text-center text-sm text-destructive">{error}</div> : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground"><MessageSquare className="h-9 w-9 opacity-40" /><p className="font-medium text-foreground">No conversations yet</p><p>Chats appear automatically after a rental application is approved.</p></div>
                    ) : filteredConversations.map((conversation) => {
                        const preview = conversation.lastMessage ? conversation.lastMessage.type === "text" ? conversation.lastMessage.message : "Shared an attachment" : "Start the conversation"
                        const date = conversation.lastMessage?.created_at || conversation.created_at
                        return <button key={conversation.id} onClick={() => { setSelectedId(conversation.id); setShowChat(true) }} className={`flex w-full gap-3 border-b p-4 text-left transition-colors hover:bg-muted/60 ${selectedId === conversation.id ? "bg-muted" : ""}`}>
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">{conversation.otherUser.name.charAt(0).toUpperCase()}</div>
                            <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-1 truncate text-sm font-semibold">{conversation.otherUser.name}{conversation.otherUser.isVerified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}</span><span className="shrink-0 text-[10px] text-muted-foreground">{new Date(date).toLocaleDateString([], { month: "short", day: "numeric" })}</span></div><p className="truncate text-xs font-medium text-foreground/70">{conversation.property?.title || "Rental conversation"}</p><div className="mt-1 flex items-center gap-2"><p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{preview}</p>{conversation.unreadCount > 0 && <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">{conversation.unreadCount}</Badge>}</div></div>
                        </button>
                    })}
                </ScrollArea></CardContent>
            </Card>
            <Card className={`${showChat ? "flex" : "hidden"} h-full min-w-0 flex-col overflow-hidden md:col-span-2 md:flex`}>
                {selectedConversation ? <MessageWindow conversationId={selectedConversation.id} currentUserId={currentUserId} otherUserId={selectedConversation.otherUser.id} otherUserName={selectedConversation.otherUser.name} onBack={() => setShowChat(false)} /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground"><MessageSquare className="h-12 w-12 opacity-30" /><p className="font-medium text-foreground">Select a conversation</p><p className="text-sm">Choose a tenant or landlord to start chatting.</p></div>}
            </Card>
        </div>
    )
}

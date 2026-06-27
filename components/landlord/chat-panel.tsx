"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageWindow } from "@/components/chat/message-window"
import { ShieldCheck } from "lucide-react"

interface ChatPanelProps {
    landlordId: string
}

interface Message {
    id: string
    sender_id: string
    message: string
    created_at: string
    conversation_id: string
}

interface Conversation {
    id: string
    rental_id: string
    tenant_id: string
    tenant: {
        name: string
        is_verified?: boolean
    }
}

export function ChatPanel({ landlordId }: ChatPanelProps) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
    const [showChat, setShowChat] = useState(false)

    const searchParams = useSearchParams()
    const targetRentalId = searchParams.get('rentalId')
    const targetConvId = searchParams.get('convId')

    const fetchConversations = useCallback(async () => {
        const { data } = await supabase
            .from('conversations')
            .select(`
        id,
        rental_id,
        tenant_id, 
        tenant:profiles!tenant_id (name, is_verified)
      `)
            .eq('landlord_id', landlordId)

        if (data) setConversations(data as unknown as Conversation[])
    }, [landlordId])

    useEffect(() => {
        if (landlordId) fetchConversations()
    }, [landlordId, fetchConversations])

    // Effect to handle selecting the correct conversation
    useEffect(() => {
        if (conversations.length > 0) {
            if (targetConvId) {
                const target = conversations.find(c => c.id === targetConvId)
                if (target) {
                    setSelectedConv(target)
                    return
                }
            }
            if (targetRentalId) {
                const target = conversations.find(c => c.rental_id === targetRentalId)
                if (target) {
                    setSelectedConv(target)
                    return
                }
            }
            if (!selectedConv) {
                setSelectedConv(conversations[0])
            }
        }
    }, [conversations, selectedConv, targetRentalId, targetConvId])

    return (
        <div className="flex h-[calc(100vh-12rem)] min-h-[500px] gap-0 md:gap-4">
            {/* Sidebar for Conversations - full width on mobile, 1/3 on desktop */}
            <Card className={`${showChat ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col h-full`}>
                <CardHeader className="py-4">
                    <CardTitle>Conversations</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full">
                        <div className="flex flex-col">
                            {conversations.length === 0 ? (
                                <div className="p-4 text-sm text-muted-foreground text-center mt-10">No conversations yet.</div>
                            ) : (
                                conversations.map((c) => {
                                    const tenantName = c.tenant?.name || 'Unknown Tenant'
                                    const initial = tenantName.charAt(0).toUpperCase()
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => { setSelectedConv(c); setShowChat(true); }}
                                            className={`flex items-center gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 w-full ${selectedConv?.id === c.id ? 'bg-slate-50 dark:bg-slate-800/50' : ''
                                                }`}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex-shrink-0 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                                                {initial}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="font-semibold text-[15px] flex items-center justify-between">
                                                    <span className="truncate pr-2 flex items-center gap-1">
                                                        {tenantName}
                                                        {c.tenant?.is_verified && (
                                                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                        )}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-normal shrink-0">Today</span>
                                                </div>
                                                <div className="text-[13px] text-slate-500 truncate mt-0.5">
                                                    {c.rental_id ? `Tap to view conversation` : 'General Inquiry'}
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Chat Area - full width on mobile, flex-1 on desktop */}
            <Card className={`${!showChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full overflow-hidden border`}>
                {selectedConv ? (
                    <MessageWindow
                        conversationId={selectedConv.id}
                        currentUserId={landlordId}
                        otherUserId={selectedConv.tenant_id}
                        otherUserName={selectedConv.tenant?.name}
                        onBack={() => setShowChat(false)}
                    />
                ) : (
                    <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
                        <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">💬</span>
                        </div>
                        <h3 className="text-lg font-medium text-foreground">Your Messages</h3>
                        <p className="text-sm">Select conversations on the left.</p>
                    </div>
                )}
            </Card>
        </div>
    )
}

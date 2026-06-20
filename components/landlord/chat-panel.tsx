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
    }
}

export function ChatPanel({ landlordId }: ChatPanelProps) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)

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
        tenant:profiles!tenant_id (name)
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
        <div className="flex h-[calc(100vh-12rem)] min-h-[500px] gap-4">
            {/* Sidebar for Conversations */}
            <Card className="w-1/3 flex flex-col h-full">
                <CardHeader className="py-4">
                    <CardTitle>Conversations</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full">
                        <div className="flex flex-col">
                            {conversations.length === 0 ? (
                                <div className="p-4 text-sm text-muted-foreground">No conversations yet.</div>
                            ) : (
                                conversations.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => setSelectedConv(c)}
                                        className={`p-4 text-left hover:bg-muted transition-colors border-b ${selectedConv?.id === c.id ? 'bg-muted border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'
                                            }`}
                                    >
                                        <div className="font-semibold text-sm">{c.tenant?.name || 'Unknown Tenant'}</div>
                                        <div className="text-xs text-muted-foreground truncate mt-1">
                                            {c.rental_id ? `Rental ID: ${c.rental_id}` : 'General Inquiry'}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col h-full overflow-hidden border">
                {selectedConv ? (
                    <MessageWindow
                        conversationId={selectedConv.id}
                        currentUserId={landlordId}
                        otherUserId={selectedConv.tenant_id}
                        otherUserName={selectedConv.tenant?.name}
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

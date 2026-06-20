"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, User, Wrench, Building } from "lucide-react"

interface Message {
    id: string
    sender_id: string
    message: string
    created_at: string
    sender?: {
        fullname: string // Updated to match latest schema
        avatar_url?: string
        role: string // Added role to differentiate sender type
    }
}

interface MaintenanceChatProps {
    requestId: string
    currentUserId: string
}

export function MaintenanceChat({ requestId, currentUserId }: MaintenanceChatProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Fetch initial messages
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('maintenance_messages')
                .select(`
                    *,
                    sender:profiles (
                        fullname,
                        avatar_url,
                        role
                    )
                `)
                .eq('request_id', requestId)
                .order('created_at', { ascending: true })

            if (error) console.error('Error fetching messages:', error)
            else setMessages(data || [])
        }

        fetchMessages()

        // Subscribe to new messages
        const channel = supabase
            .channel(`maintenance_chat:${requestId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'maintenance_messages',
                filter: `request_id=eq.${requestId}`
            }, async (payload) => {
                // Fetch sender details for the new message
                const { data } = await supabase
                    .from('profiles')
                    .select('fullname, avatar_url, role')
                    .eq('id', payload.new.sender_id)
                    .single()

                const newMsg = {
                    ...payload.new,
                    sender: data
                } as Message

                setMessages(prev => [...prev, newMsg])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [requestId])

    useEffect(() => {
        // Scroll to bottom when messages update
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight
            }
        }
    }, [messages])

    const handleSend = async () => {
        if (!newMessage.trim()) return

        setLoading(true)
        const { error } = await supabase
            .from('maintenance_messages')
            .insert({
                request_id: requestId,
                sender_id: currentUserId,
                message: newMessage.trim()
            })

        if (error) {
            console.error('Error sending message:', error)
        } else {
            setNewMessage("")
        }
        setLoading(false)
    }

    const getRoleIcon = (role?: string) => {
        switch (role) {
            case 'landlord': return <Building className="h-3 w-3" />
            case 'service_provider': return <Wrench className="h-3 w-3" />
            default: return <User className="h-3 w-3" />
        }
    }

    const getRoleLabel = (role?: string) => {
        switch (role) {
            case 'landlord': return 'Landlord'
            case 'service_provider': return 'Provider'
            case 'tenant': return 'Tenant'
            default: return 'User'
        }
    }

    return (
        <Card className="h-[600px] flex flex-col border shadow-sm container p-0 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b dark:bg-slate-900 px-6 py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                    Live Chat
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4 bg-slate-50/50 dark:bg-slate-950/50">
                <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
                    <div className="space-y-6 pb-4 pt-2">
                        {messages.length === 0 && (
                            <div className="text-center text-muted-foreground text-sm py-10">
                                No messages yet. Start the conversation!
                            </div>
                        )}
                        {messages.map((msg) => {
                            const isMe = msg.sender_id === currentUserId
                            const role = msg.sender?.role || 'tenant'

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    {!isMe && (
                                        <Avatar className="h-9 w-9 border bg-card">
                                            <AvatarImage src={msg.sender?.avatar_url} />
                                            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                                                {msg.sender?.fullname?.[0] || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}

                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                        <div className="flex items-center gap-2 mb-1.5 px-1">
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                {isMe ? 'You' : msg.sender?.fullname || 'Unknown User'}
                                            </span>
                                            {!isMe && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 font-medium ${role === 'landlord' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' :
                                                        role === 'service_provider' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' :
                                                            'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}>
                                                    {getRoleIcon(role)}
                                                    {getRoleLabel(role)}
                                                </span>
                                            )}
                                        </div>

                                        <div
                                            className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm ${isMe
                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                    : 'bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-tl-none'
                                                }`}
                                        >
                                            <div className="whitespace-pre-wrap break-words">{msg.message}</div>
                                        </div>

                                        <div className="text-[10px] text-muted-foreground mt-1.5 px-1 font-medium">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
                <div className="mt-4 flex gap-2 pt-2 bg-transparent relative z-10">
                    <Input
                        placeholder="Type your message..."
                        className="rounded-full shadow-sm bg-white dark:bg-slate-900"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={loading}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={loading || !newMessage.trim()}
                        className="rounded-full shadow-sm hover:scale-105 transition-transform"
                        size="icon"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

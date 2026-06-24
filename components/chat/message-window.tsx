"use client";

import React, { useState, useEffect, useRef } from "react";
import { useChat } from "./chat-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Phone, Video, Paperclip, Check, CheckCheck, ArrowLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface Message {
    id: string;
    senderId: string;
    content: string;
    timestamp: Date;
    isMe: boolean;
    type?: string;
    fileUrl?: string;
    read?: boolean;
}

interface MessageWindowProps {
    conversationId: string;
    currentUserId: string;
    otherUserId?: string;
    otherUserName?: string;
    onBack?: () => void;
}

export function MessageWindow({ conversationId, currentUserId, otherUserId, otherUserName, onBack }: MessageWindowProps) {
    const { typingUsers, sendTyping, markMessageAsRead, callUser } = useChat();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [otherUserVerified, setOtherUserVerified] = useState(false);

    useEffect(() => {
        if (!otherUserId) return;
        const fetchOtherUserVerification = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('is_verified')
                .eq('id', otherUserId)
                .maybeSingle();
            if (data?.is_verified) {
                setOtherUserVerified(true);
            } else {
                setOtherUserVerified(false);
            }
        };
        fetchOtherUserVerification();
    }, [otherUserId]);

    // Load Messages and setup Supabase Realtime Subscription
    useEffect(() => {
        if (!conversationId) return;

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) console.error("Error fetching messages:", error);
            if (data) {
                const formattedMessages = data.map((msg: any) => ({
                    id: msg.id,
                    senderId: msg.sender_id,
                    content: msg.message,
                    timestamp: new Date(msg.created_at),
                    isMe: msg.sender_id === currentUserId,
                    type: msg.type || 'text',
                    fileUrl: msg.file_url,
                    read: msg.read_at ? true : false
                }));
                setMessages(formattedMessages);

                // Mark unread from others as read
                const unreadFromOther = data.filter(m => !m.read_at && m.sender_id !== currentUserId);
                unreadFromOther.forEach(m => markMessageAsRead(conversationId, m.id));
            }
        };

        fetchMessages();

        // Setup Postgres Changes subscription for new & updated messages
        const messageSubscription = supabase
            .channel(`public:messages:${conversationId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
                (payload) => {
                    const newMsg = payload.new as any;
                    setMessages((prev) => {
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, {
                            id: newMsg.id,
                            senderId: newMsg.sender_id,
                            content: newMsg.message,
                            timestamp: new Date(newMsg.created_at),
                            isMe: newMsg.sender_id === currentUserId,
                            type: newMsg.type || 'text',
                            fileUrl: newMsg.file_url,
                            read: !!newMsg.read_at
                        }];
                    });

                    if (newMsg.sender_id !== currentUserId) {
                        markMessageAsRead(conversationId, newMsg.id);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
                (payload) => {
                    const updatedMsg = payload.new as any;
                    setMessages(prev => prev.map(m =>
                        m.id === updatedMsg.id
                            ? { ...m, read: !!updatedMsg.read_at }
                            : m
                    ));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(messageSubscription);
        };
    }, [conversationId, currentUserId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        sendTyping(conversationId, true);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            sendTyping(conversationId, false);
        }, 2000);
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const textToSend = inputValue;
        setInputValue(""); // Optimistic clear

        const messageData = {
            conversation_id: conversationId,
            message: textToSend,
            sender_id: currentUserId,
            type: 'text'
        };

        const { error } = await supabase
            .from('messages')
            .insert(messageData);

        if (error) {
            console.error("Failed to send message:", error);
            // Optionally revert the clear if needed, but in standard chat apps it's usually clear and error later
        } else {
            // Typing stops when sent
            sendTyping(conversationId, false);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${conversationId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-files')
                .getPublicUrl(filePath);

            const messageData = {
                conversation_id: conversationId,
                message: file.name,
                sender_id: currentUserId,
                type: file.type.startsWith('image/') ? 'image' : 'file',
                file_url: publicUrl
            };

            const { error: insertError } = await supabase
                .from('messages')
                .insert(messageData);

            if (insertError) throw insertError;

        } catch (error) {
            console.error("File upload failed:", error);
            alert("Failed to upload file");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-white dark:bg-zinc-950 shrink-0">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="md:hidden mr-2 p-1.5 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    )}
                    <h3 className="font-semibold flex items-center gap-1">
                        {otherUserName || `Conversation`}
                        {otherUserVerified && (
                            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 inline-block shrink-0" />
                        )}
                    </h3>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => otherUserId && callUser(otherUserId)} variant="ghost" size="icon" disabled={!otherUserId}>
                        <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={true}>
                        <Video className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20 min-h-0">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        No messages yet. Send a message to start the conversation!
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex max-w-[85%] sm:max-w-[70%]",
                                msg.isMe ? "ml-auto justify-end" : "mr-auto justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "p-3 rounded-2xl text-sm shadow-sm flex flex-col group",
                                    msg.isMe
                                        ? "bg-blue-600 text-white rounded-tr-sm"
                                        : "bg-white dark:bg-zinc-800 border rounded-tl-sm"
                                )}
                            >
                                {msg.type === 'image' && msg.fileUrl ? (
                                    <div className="mb-2 rounded-md overflow-hidden bg-white/20">
                                        <img src={msg.fileUrl} alt="Shared image" className="max-w-[200px] w-full" />
                                    </div>
                                ) : msg.type === 'file' && msg.fileUrl ? (
                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium break-all text-blue-200 mb-1 block">
                                        📎 {msg.content}
                                    </a>
                                ) : (
                                    <p className="break-words leading-relaxed">{msg.content}</p>
                                )}
                                <div className="flex items-center justify-end gap-1.5 mt-1.5 shrink-0">
                                    <span className={cn("text-[10px] select-none", msg.isMe ? "text-blue-100" : "text-muted-foreground")}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {msg.isMe && (
                                        <span className="text-blue-200">
                                            {msg.read ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3 w-3" />}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {/* Typing Indicator */}
                {typingUsers[conversationId]?.length > 0 && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-zinc-800 border p-3 rounded-2xl rounded-tl-sm flex gap-1 items-center max-w-[60px]">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Input Area */}
            <div className="p-3 pb-safe border-t bg-white dark:bg-zinc-950 flex gap-2 items-end shrink-0">
                <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-5 w-5" />
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                />
                <Input
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-blue-500"
                />
                <Button onClick={handleSend} size="icon" className="shrink-0 h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50" disabled={!inputValue.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

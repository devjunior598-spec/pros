"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ConversationList } from "./conversation-list";
import { MessageWindow } from "./message-window";
import { useChat } from "./chat-provider";

interface ConversationSummary {
    id: string;
    name: string;
    lastMessage: string;
    unread: number;
    avatar: string;
    otherUserId?: string;
}

interface ConversationPayload {
    id: string;
    otherUser?: { id?: string; name?: string; avatarUrl?: string };
    lastMessage?: { message?: string };
    property?: { title?: string };
    unreadCount?: number;
}

export default function ChatPageLayout() {
    const { isConnected } = useChat();
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [loadingConversations, setLoadingConversations] = useState(true);

    useEffect(() => {
        const fetchChatData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }

            try {
                const response = await fetch("/api/messages/conversations");
                const payload = await response.json();
                if (!response.ok) {
                    throw new Error(payload.error || "Failed to load conversations");
                }

                setConversations(((payload.conversations || []) as ConversationPayload[]).map((conversation) => ({
                    id: conversation.id,
                    name: conversation.otherUser?.name || "Conversation",
                    lastMessage: conversation.lastMessage?.message || conversation.property?.title || "No messages yet",
                    unread: conversation.unreadCount || 0,
                    avatar: conversation.otherUser?.avatarUrl || "",
                    otherUserId: conversation.otherUser?.id,
                })));
            } catch (error) {
                console.error("Error loading conversations:", error);
                setConversations([]);
            } finally {
                setLoadingConversations(false);
            }
        };
        fetchChatData();
    }, []);

    return (
        <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background border rounded-xl shadow-sm">
            {/* Sidebar - Conversation List */}
            <div className={`${showChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r flex-col`}>
                <div className="p-4 border-b">
                    <h2 className="font-semibold text-lg">Messages</h2>
                    <div className="text-xs text-muted-foreground mt-1">
                        {isConnected ? <span className="text-green-500">● Connected</span> : <span className="text-red-500">● Disconnected</span>}
                    </div>
                </div>
                <ConversationList
                    conversations={conversations}
                    selectedId={selectedConversation}
                    onSelect={(id) => { setSelectedConversation(id); setShowChat(true); }}
                />
                {!loadingConversations && conversations.length === 0 && (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                        No conversations yet.
                    </div>
                )}
            </div>

            {/* Main Chat Area */}
            <div className={`${!showChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}>
                {selectedConversation && currentUserId ? (
                    <MessageWindow conversationId={selectedConversation} currentUserId={currentUserId} otherUserId={conversations.find(item => item.id === selectedConversation)?.otherUserId} otherUserName={conversations.find(item => item.id === selectedConversation)?.name} onBack={() => setShowChat(false)} />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select a conversation to start chatting
                    </div>
                )}
            </div>

        </div>
    );
}

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ConversationList } from "./conversation-list";
import { MessageWindow } from "./message-window";
import { useChat } from "./chat-provider";
import { CallModal } from "./call-modal";

export default function ChatPageLayout() {
    const { isConnected } = useChat();
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

    // Dummy data for now, replace with Supabase fetch
    const [conversations, setConversations] = useState([
        { id: '1', name: 'John Landlord', lastMessage: 'See you tomorrow', unread: 2, avatar: '' },
        { id: '2', name: 'Plumber Mike', lastMessage: 'Leak is fixed', unread: 0, avatar: '' },
    ]);

    const [currentUserId, setCurrentUserId] = useState<string>("");

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }
        };
        fetchUser();
    }, []);

    return (
        <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background border rounded-xl shadow-sm">
            {/* Sidebar - Conversation List */}
            <div className="w-80 border-r flex flex-col hidden md:flex">
                <div className="p-4 border-b">
                    <h2 className="font-semibold text-lg">Messages</h2>
                    <div className="text-xs text-muted-foreground mt-1">
                        {isConnected ? <span className="text-green-500">● Connected</span> : <span className="text-red-500">● Disconnected</span>}
                    </div>
                </div>
                <ConversationList
                    conversations={conversations}
                    selectedId={selectedConversation}
                    onSelect={setSelectedConversation}
                />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedConversation && currentUserId ? (
                    <MessageWindow conversationId={selectedConversation} currentUserId={currentUserId} />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select a conversation to start chatting
                    </div>
                )}
            </div>

            {/* Call Modal (Global) */}
            <CallModal />
        </div>
    );
}

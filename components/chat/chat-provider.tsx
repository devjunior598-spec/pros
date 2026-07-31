"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChatContextType {
    isConnected: boolean;
    unreadMessageCount: number;
    typingUsers: Record<string, string[]>;
    sendTyping: (conversationId: string, isTyping: boolean) => void;
    markMessageAsRead: (conversationId: string, messageId: string) => void;
    callUser: (id: string) => void;
}

const ChatContext = createContext<ChatContextType>({
    isConnected: false,
    unreadMessageCount: 0,
    typingUsers: {},
    sendTyping: () => { },
    markMessageAsRead: () => { },
    callUser: () => { },
});

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
    const [globalChannel, setGlobalChannel] = useState<RealtimeChannel | null>(null);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);

    useEffect(() => {
        let active = true;
        let messageChannel: RealtimeChannel | null = null;

        const initializeUnreadCount = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !active) {
                setUnreadMessageCount(0);
                return;
            }

            const refreshCount = async () => {
                const { data: conversations } = await supabase
                    .from('conversations')
                    .select('id')
                    .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`);
                const conversationIds = (conversations || []).map(conversation => conversation.id);
                if (conversationIds.length === 0) {
                    if (active) setUnreadMessageCount(0);
                    return;
                }
                const { count } = await supabase
                    .from('messages')
                    .select('id', { count: 'exact', head: true })
                    .in('conversation_id', conversationIds)
                    .neq('sender_id', user.id)
                    .is('read_at', null);
                if (active) setUnreadMessageCount(count || 0);
            };

            await refreshCount();
            messageChannel = supabase
                .channel(`unread-messages:${user.id}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
                    if (payload.new.sender_id !== user.id) void refreshCount();
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => void refreshCount())
                .subscribe();
        };

        void initializeUnreadCount();
        return () => {
            active = false;
            if (messageChannel) supabase.removeChannel(messageChannel);
        };
    }, []);

    useEffect(() => {
        // Initialize Supabase realtime for presence/typing indicators
        const channel = supabase.channel('global_chat_presence');

        channel
            .on('broadcast', { event: 'typing' }, (payload) => {
                const { conversation_id, userId, isTyping } = payload.payload;
                setTypingUsers(prev => {
                    const currentTypers = prev[conversation_id] || [];
                    if (isTyping && !currentTypers.includes(userId)) {
                        return { ...prev, [conversation_id]: [...currentTypers, userId] };
                    } else if (!isTyping) {
                        return { ...prev, [conversation_id]: currentTypers.filter(id => id !== userId) };
                    }
                    return prev;
                });
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    setGlobalChannel(channel);
                }
            });

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    const sendTyping = async (conversationId: string, isTyping: boolean) => {
        if (!globalChannel) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await globalChannel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { conversation_id: conversationId, userId: session.user.id, isTyping }
        });
    };

    const markMessageAsRead = async (conversationId: string, messageId: string) => {
        await fetch('/api/messages/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId, messageId })
        });
    };

    const callUser = () => {
        alert("Video/Audio calling is temporarily disabled during real-time upgrade.");
    };

    return (
        <ChatContext.Provider value={{
            isConnected,
            unreadMessageCount,
            typingUsers,
            sendTyping,
            markMessageAsRead,
            callUser
        }}>
            {children}
        </ChatContext.Provider>
    );
};

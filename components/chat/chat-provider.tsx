"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChatContextType {
    isConnected: boolean;
    typingUsers: Record<string, string[]>;
    sendTyping: (conversationId: string, isTyping: boolean) => void;
    markMessageAsRead: (conversationId: string, messageId: string) => void;
    callUser: (id: string) => void;
}

const ChatContext = createContext<ChatContextType>({
    isConnected: false,
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
        await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', messageId)
            .is('read_at', null);
    };

    const callUser = (id: string) => {
        alert("Video/Audio calling is temporarily disabled during real-time upgrade.");
    };

    return (
        <ChatContext.Provider value={{
            isConnected,
            typingUsers,
            sendTyping,
            markMessageAsRead,
            callUser
        }}>
            {children}
        </ChatContext.Provider>
    );
};

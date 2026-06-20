"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Conversation {
    id: string;
    name: string;
    lastMessage: string;
    unread: number;
    avatar: string;
}

interface ConversationListProps {
    conversations: Conversation[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
    return (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {conversations.map((conv) => (
                <button
                    key={conv.id}
                    onClick={() => onSelect(conv.id)}
                    className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-accent",
                        selectedId === conv.id && "bg-accent"
                    )}
                >
                    <Avatar>
                        <AvatarImage src={conv.avatar} />
                        <AvatarFallback>{conv.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                            <span className="font-medium truncate">{conv.name}</span>
                            {/* <span className="text-xs text-muted-foreground">12:30 PM</span> */}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unread > 0 && (
                        <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                            {conv.unread}
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
}

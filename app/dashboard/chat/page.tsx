import { Suspense } from "react";
import ChatPageLayout from "@/components/chat/chat-layout";
import { ChatProvider } from "@/components/chat/chat-provider";

export default function ChatPage() {
    return (
        <div className="h-[calc(100vh-2rem)]">
            <ChatProvider>
                <ChatPageLayout />
            </ChatProvider>
        </div>
    );
}

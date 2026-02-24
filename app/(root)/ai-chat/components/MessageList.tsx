"use client";

import { useChatStore } from "@/stores/ai-chat/useChatStore";
import { MessageBubble } from "./MessageBubble";

export const MessageList = () => {
    const messages = useChatStore((s) => s.messages);

    return (
        <div className="space-y-2">
            {messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} content={m.content} />
            ))}
        </div>
    );
}
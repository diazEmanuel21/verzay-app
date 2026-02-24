"use client";

import { ChatMessage } from "@/types/ai-assistence-chat";
import { create } from "zustand";

type ChatState = {
    isOpen: boolean;
    messages: ChatMessage[];
    isSending: boolean;
    setOpen: (v: boolean) => void;
    addMessage: (m: ChatMessage) => void;
    setSending: (v: boolean) => void;
    reset: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
    isOpen: false,
    messages: [
        {
            id: "welcome",
            role: "assistant",
            content: "Hola 👋 Dime qué quieres hacer en la app y te guío paso a paso.",
            createdAt: Date.now(),
        },
    ],
    isSending: false,
    setOpen: (v) => set({ isOpen: v }),
    addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
    setSending: (v) => set({ isSending: v }),
    reset: () =>
        set({
            messages: [
                {
                    id: "welcome",
                    role: "assistant",
                    content: "Listo ✅ Empecemos de nuevo. ¿Qué necesitas hacer?",
                    createdAt: Date.now(),
                },
            ],
        }),
}));
"use client";

import { useState, useTransition } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useChatContext } from "../hooks/useChatContext";
import { useChatStore } from "@/stores/ai-chat/useChatStore";
import { sendChatAction } from "@/actions/ai-chat-actions";

export function ChatComposer() {
    const [text, setText] = useState("");
    const [isPending, startTransition] = useTransition();

    const ctx = useChatContext();
    const addMessage = useChatStore((s) => s.addMessage);

    const send = () => {
        const value = text.trim();
        if (!value || isPending) return;

        const userMsg = {
            id: crypto.randomUUID(),
            role: "user" as const,
            content: value,
            createdAt: Date.now(),
        };

        addMessage(userMsg);
        setText("");

        startTransition(async () => {
            try {
                const messages = [...useChatStore.getState().messages, userMsg];

                const res = await sendChatAction({ messages, context: ctx });

                if (!res.success) {
                    toast.error(res.message || "No se pudo procesar tu solicitud");
                    addMessage({
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content: "No pude responder en este momento. Intenta nuevamente.",
                        createdAt: Date.now(),
                    });
                    return;
                }

                const reply = res.data?.message;
                if (!reply?.content) {
                    toast.error("Respuesta vacía del asistente");
                    return;
                }

                addMessage(reply);
            } catch (err: any) {
                toast.error("Error consultando el asistente");
                addMessage({
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: "Ocurrió un error consultando el asistente. Intenta de nuevo.",
                    createdAt: Date.now(),
                });
            }
        });
    };

    return (
        <div className="flex gap-2">
            <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe tu duda... (Shift+Enter para salto de línea)"
                className="min-h-[44px] max-h-[120px] resize-none"
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                    }
                }}
                disabled={isPending}
            />
            <Button onClick={send} className="h-[44px]" disabled={isPending}>
                {isPending ? "..." : "Enviar"}
            </Button>
        </div>
    );
}
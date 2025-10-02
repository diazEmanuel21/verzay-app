"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMain } from "./chat-main";

// 🔑 CORRECCIÓN: Importamos los tipos directamente de la fuente de verdad (acciones)
import type {
    EvolutionMessage,
    FetchChatsResult,
    FindMessagesResult
} from "@/actions/chat-actions";

/* 🛑 Tipos duplicados eliminados (LastMessage, ChatData, FetchChatsResult) 🛑 */

interface ChatsClientProps {
    chatsResult: FetchChatsResult; // Usa el tipo importado
    initialSelectedJid: string;
    initialMessages: EvolutionMessage[]; // Usa el tipo importado
    instanceName?: string;
    /**
    * Server Action (Clausura Directa) simplificada.
    * Debe coincidir con el tipo de retorno de findMessagesByRemoteJid.
    */
    warmMessages?: (
        remoteJid: string,
        opts?: { page?: number; pageSize?: number }
    ) => Promise<FindMessagesResult>; // Usa el tipo importado
}

export function ChatsClient({
    chatsResult,
    initialSelectedJid,
    initialMessages,
    warmMessages,
    instanceName,
}: ChatsClientProps) {
    const [selectedJid, setSelectedJid] = useState(initialSelectedJid || "");

    const [messages, setMessages] = useState<EvolutionMessage[]>(initialMessages || []);

    const [info, setInfo] = useState<
        | {
            total?: number;
            pages?: number;
            currentPage?: number;
            nextPage?: number | null;
            instanceName?: string;
            remoteJid?: string;
        }
        | undefined
    >(initialSelectedJid ? { instanceName, remoteJid: initialSelectedJid } : undefined);

    const [loading, setLoading] = useState(false);

    const contacts = useMemo(() => {
        // ChatData ahora se infiere de FetchChatsResult
        return chatsResult.success ? chatsResult.data : [];
    }, [chatsResult]);

    const currentContact = useMemo(() => {
        if (!contacts.length || !selectedJid) return undefined;
        return contacts.find((c) => c.remoteJid === selectedJid);
    }, [contacts, selectedJid]);

    const header = useMemo(() => {
        return {
            name: currentContact?.pushName || selectedJid || "Sin contacto",
            avatarSrc: currentContact?.profilePicUrl || "/placeholder.svg",
            status: currentContact?.lastMessage?.messageTimestamp ? "último mensaje" : "—",
        };
    }, [currentContact, selectedJid]);

    // Autoselección inicial
    useEffect(() => {
        if (!selectedJid && contacts.length > 0) {
            const first = contacts[0].remoteJid;
            setSelectedJid(first);
            setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid: first }));
            setMessages([]);
        }
    }, [contacts, selectedJid, instanceName]);

    // HANDLER para cambiar de chat
    const handleSelectFromSidebar = useCallback(async (remoteJid: string) => {
        if (selectedJid === remoteJid) return;

        setSelectedJid(remoteJid);
        setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid }));
        setLoading(true);
        setMessages([]);

        if (!warmMessages) {
            setLoading(false);
            return;
        }

        try {
            const page = 1;
            const pageSize = 50;

            const res = await warmMessages(remoteJid, { page, pageSize });

            if (res?.success) {
                setMessages(res.data || []);

                setInfo({
                    total: res.total,
                    pages: res.pages,
                    currentPage: res.currentPage,
                    nextPage: res.nextPage ?? null,
                    instanceName,
                    remoteJid,
                });
            } else {
                setMessages([]);
                setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid }));
                console.warn("[ChatsClient] warmMessages error:", res?.message);
            }
        } catch (e) {
            setMessages([]);
            setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid }));
            console.error("[ChatsClient] warmMessages exception:", e);
        } finally {
            setLoading(false);
        }
    }, [selectedJid, warmMessages, instanceName]);

    return (
        <div className="flex h-full">
            <ChatSidebar
                result={chatsResult}
                onSelectRemoteJid={handleSelectFromSidebar}
                selectedJid={selectedJid}
            />
            <ChatMain
                key={selectedJid || "no-jid"}
                header={header}
                messages={messages}
                info={info}
                loading={loading}
            />
        </div>
    );
}
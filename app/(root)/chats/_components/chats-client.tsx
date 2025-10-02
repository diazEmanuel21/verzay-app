"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMain } from "./chat-main";

import type {
    EvolutionMessage,
    FetchChatsResult,
    FindMessagesResult,
    SendMessageResult,
} from "@/actions/chat-actions"; 

interface ChatsClientProps {
    chatsResult: FetchChatsResult;
    initialSelectedJid: string;
    initialMessages: EvolutionMessage[];
    instanceName?: string;
    warmMessages?: (
        remoteJid: string,
        opts?: { page?: number; pageSize?: number }
    ) => Promise<FindMessagesResult>;
    sendText: (
        remoteJid: string,
        textMessage: string
    ) => Promise<SendMessageResult>;
    /** Server Action para refrecar la lista de chats */
    refetchChats: () => Promise<FetchChatsResult>; 
}

export function ChatsClient({
    chatsResult: initialChatsResult,
    initialSelectedJid,
    initialMessages,
    warmMessages,
    sendText,
    refetchChats,
    instanceName,
}: ChatsClientProps) {
    const [selectedJid, setSelectedJid] = useState(initialSelectedJid || "");
    const [currentChatsResult, setCurrentChatsResult] = useState(initialChatsResult); 
    const [messages, setMessages] = useState<EvolutionMessage[]>(initialMessages || []);

    const [info, setInfo] = useState<
        | {
            total?: number; pages?: number; currentPage?: number; nextPage?: number | null;
            instanceName?: string; remoteJid?: string;
        }
        | undefined
    >(initialSelectedJid ? { instanceName, remoteJid: initialSelectedJid } : undefined);

    const [loading, setLoading] = useState(false);

    const contacts = useMemo(() => {
        return currentChatsResult.success ? currentChatsResult.data : [];
    }, [currentChatsResult]);

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

    // Autoselección inicial (usando 'contacts' del estado)
    useEffect(() => {
        if (!selectedJid && contacts.length > 0) {
            const first = contacts[0].remoteJid;
            setSelectedJid(first);
            setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid: first }));
            setMessages([]);
        }
    }, [contacts, selectedJid, instanceName]);


    // 1. LÓGICA DE ACTUALIZACIÓN PERIÓDICA DE CHATS (Sidebar Polling)
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        
        const fetchNewChats = async () => {
            const result = await refetchChats();
            if (result.success) {
                setCurrentChatsResult(result); 
            } else {
                console.warn("[ChatsClient] Fallo al refrescar chats:", result.message);
            }
        };

        if (initialChatsResult.success) {
            intervalId = setInterval(fetchNewChats, 3000); 
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [refetchChats, initialChatsResult.success]);


    // HANDLER para cambiar de chat (Cargar historial) y RECARGAR MENSAJES
    const handleSelectFromSidebar = useCallback(async (remoteJid: string) => {
        if (selectedJid !== remoteJid) {
            setSelectedJid(remoteJid);
        }
        
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


    // 🟢 2. LÓGICA DE ACTUALIZACIÓN PERIÓDICA DE MENSAJES (ChatMain Polling)
    useEffect(() => {
        let messagePollingId: NodeJS.Timeout | null = null;
        
        const pollMessages = () => {
            if (selectedJid && warmMessages) {
                // Reutiliza el handler principal para forzar la recarga de mensajes
                handleSelectFromSidebar(selectedJid); 
            }
        };

        // Si hay un chat seleccionado y la función de fetch existe, iniciamos el polling
        if (selectedJid && warmMessages) {
            // Recarga los mensajes del chat activo cada 15 segundos
            messagePollingId = setInterval(pollMessages, 700); 
        }

        // Función de limpieza
        return () => {
            if (messagePollingId) clearInterval(messagePollingId);
        };
    }, [selectedJid, warmMessages, handleSelectFromSidebar]);


    // 3. HANDLER: Función para enviar el mensaje de texto (con recarga inmediata)
    const handleSendText = useCallback(async (text: string) => {
        if (!selectedJid || !sendText) {
            console.warn("[ChatsClient] No se puede enviar: remoteJid no seleccionado o función sendText no proporcionada.");
            return;
        }

        const result = await sendText(selectedJid, text);
        
        if (result.success) {
            console.log("✅ Mensaje enviado con éxito. Forzando recarga de mensajes y chats.");
            
            // A) ACTUALIZACIÓN INMEDIATA DE MENSAJES DEL CHAT ACTUAL
            if (warmMessages) {
                handleSelectFromSidebar(selectedJid); 
            }

            // B) RECARGAR LISTA DE CHATS
            await refetchChats(); 
            
        } else {
            console.error("❌ Error al enviar mensaje:", result.message, result.raw);
        }
    }, [selectedJid, sendText, warmMessages, refetchChats, handleSelectFromSidebar]);


    return (
        <div className="flex h-full">
            <ChatSidebar
                result={currentChatsResult}
                onSelectRemoteJid={handleSelectFromSidebar}
                selectedJid={selectedJid}
            />
            <ChatMain
                key={selectedJid || "no-jid"}
                header={header}
                messages={messages}
                info={info}
                loading={loading}
                handleSend={handleSendText}
            />
        </div>
    );
}
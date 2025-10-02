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

    // Autoselección inicial
    useEffect(() => {
        if (!selectedJid && contacts.length > 0) {
            const first = contacts[0].remoteJid;
            setSelectedJid(first);
            setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid: first }));
            // Solo limpiamos si no había una selección inicial, evitando borrar mensajes existentes.
            if (!initialSelectedJid) setMessages([]);
        }
    }, [contacts, selectedJid, instanceName, initialSelectedJid]);



    // 💡 NUEVO HANDLER: Solo para actualizar mensajes sin afectar loading ni limpiar
    const pollAndCompareMessages = useCallback(async (remoteJid: string) => {
        if (!warmMessages) return;

        try {
            const page = 1;
            const pageSize = 50;

            const res = await warmMessages(remoteJid, { page, pageSize });

            if (res?.success) {
                const newMessages = res.data || [];

                // 🔑 LÓGICA CLAVE: Compara la longitud de los mensajes actuales
                // Si la cantidad de mensajes es diferente, actualiza.
                if (newMessages.length !== messages.length) {
                    setMessages(newMessages);
                    setInfo({ ...res, instanceName, remoteJid });
                }
            } else {
                console.warn("[ChatsClient] warmMessages error during polling:", res?.message);
            }
        } catch (e) {
            console.error("[ChatsClient] warmMessages exception during polling:", e);
        }
    }, [warmMessages, instanceName, messages.length]); // Dependencia CRUCIAL: messages.length


    // HANDLER para cambiar de chat (Carga inicial LIMPIA)
    const handleSelectFromSidebar = useCallback(async (remoteJid: string) => {
        if (selectedJid !== remoteJid) {
            setSelectedJid(remoteJid);
        }

        setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid }));
        setLoading(true);
        setMessages([]); // 💡 LIMPIA AQUÍ: Esto es correcto al cambiar de chat

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
                setInfo({ ...res, instanceName, remoteJid });
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


    // HANDLER: Función para enviar el mensaje de texto (con recarga inmediata)
    const handleSendText = useCallback(async (text: string) => {
        if (!selectedJid || !sendText) {
            console.warn("[ChatsClient] No se puede enviar: remoteJid no seleccionado o función sendText no proporcionada.");
            return;
        }

        const result = await sendText(selectedJid, text);

        if (result.success) {
            console.log("✅ Mensaje enviado con éxito. Forzando recarga de mensajes y chats.");

            // 1. ACTUALIZACIÓN INMEDIATA DE MENSAJES (Ahora usa el comparador)
            if (warmMessages) {
                pollAndCompareMessages(selectedJid);
            }

            // 2. RECARGAR LISTA DE CHATS
            await refetchChats();

        } else {
            console.error("❌ Error al enviar mensaje:", result.message, result.raw);
        }
    }, [selectedJid, sendText, warmMessages, refetchChats, pollAndCompareMessages]);


    // LÓGICA DE ACTUALIZACIÓN PERIÓDICA DE CHATS (Sidebar Polling - Sin cambios)
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
            intervalId = setInterval(fetchNewChats, 10000); // 10 segundos
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [refetchChats, initialChatsResult.success]);


    // 💡 LÓGICA DE ACTUALIZACIÓN PERIÓDICA DE MENSAJES (ChatMain Polling - MODIFICADO)
    useEffect(() => {
        let messagePollingId: NodeJS.Timeout | null = null;

        const pollMessages = () => {
            if (selectedJid && warmMessages) {
                // 💡 Usamos el handler comparativo
                pollAndCompareMessages(selectedJid);
            }
        };

        if (selectedJid && warmMessages) {
            // Aseguramos que la carga inicial se haga una vez al seleccionar el chat
            if (messages.length === 0 && !loading) {
                handleSelectFromSidebar(selectedJid);
            }
            messagePollingId = setInterval(pollMessages, 700);
        }

        return () => {
            if (messagePollingId) clearInterval(messagePollingId);
        };
    }, [selectedJid, warmMessages, pollAndCompareMessages, handleSelectFromSidebar, messages.length, loading]);


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
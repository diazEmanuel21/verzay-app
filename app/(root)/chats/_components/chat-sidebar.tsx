"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Inbox, X, Image as ImageIcon, Video, FileText, AudioLines, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { LucideIcon } from "lucide-react";
// Importamos el tipo MessageRecord y el hook
import { useLocalStorageObjectArray, MessageRecord } from "@/hooks/chats/useSeenMessages"; 


/* ---------- Tipos del fetch (Se mantiene) ---------- */
type MessageKey = {
    id: string;
    fromMe: boolean; // <-- USADO EN lastTextFrom
    remoteJid: string;
};

type LastMessage = {
    message?: { conversation?: string };
    messageTimestamp?: number;
    messageType?: string;
    key: MessageKey;
};
type ChatData = {
    remoteJid: string;
    pushName: string | null;
    profilePicUrl: string | null;
    lastMessage: LastMessage | null;
    unreadCount: number; // No usado, pero debe estar en el tipo si viene del fetch
};
export type FetchChatsResult =
    | { success: true; message: string; data: ChatData[] }
    | { success: false; message: string };

/* ---------- Props y Helpers (Modificado: lastTextFrom) ---------- */
type ChatSidebarProps = {
    result: FetchChatsResult;
    onSelectRemoteJid?: (remoteJid: string) => void | Promise<void>;
    selectedJid?: string;
};

function epochToMs(epoch?: number): number {
    if (!epoch) return 0;
    return epoch < 2_000_000_000 ? epoch * 1000 : epoch; 
}
function formatTimeFromEpoch(epoch?: number): string {
    const ms = epochToMs(epoch);
    if (!ms) return "";
    return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function nameFrom(chat: ChatData): string {
    const name = chat.pushName?.trim();
    if (name) return name;
    const jid = chat.remoteJid || "";
    return jid.includes("@") ? jid.split("@")[0] : jid;
}

function getIconForMessageType(type?: string): LucideIcon | null { 
    if (!type) return null;

    switch (type) {
        case 'conversation':
        case 'extendedTextMessage':
            return null;
        case 'imageMessage':
            return ImageIcon;
        case 'videoMessage':
            return Video;
        case 'audioMessage':
            return Mic;
        case 'documentMessage':
        case 'fileMessage':
            return FileText;
        case 'locationMessage':
            return null; 
        default:
            return null;
    }
}

// MODIFICADO: Ahora devuelve fromMe
function lastTextFrom(chat: ChatData): { text: string; messageType?: string, id: string, fromMe: boolean } {
    const msg = chat.lastMessage?.message;
    const type = chat.lastMessage?.messageType;
    const id = chat.lastMessage?.key.id ?? '' 
    const fromMe = chat.lastMessage?.key.fromMe ?? false; // <-- EXTRAEMOS fromMe
    let text = "";

    if (!msg) {
        text = "";
    } else if (msg.conversation) {
        text = msg.conversation;
    } else {
        switch (type) {
            case 'imageMessage':
                text = "Imagen";
                break;
            case 'videoMessage':
                text = "Video";
                break;
            case 'audioMessage':
                text = "Nota de voz";
                break;
            case 'documentMessage':
            case 'fileMessage':
                text = "Documento";
                break;
            case 'locationMessage':
                text = "Ubicación";
                break;
            default:
                text = `[${type || 'Mensaje desconocido'}]`;
                break;
        }
    }

    return { text, messageType: type, id, fromMe }; // <-- DEVOLVEMOS fromMe
}

function avatarFrom(chat: ChatData): string {
    return chat.profilePicUrl || "/placeholder.svg?height=40&width=40";
}
function isGroupJid(jid: string) {
    return jid?.includes("@g.us");
}

/* ---------- Componente UI ---------- */
export function ChatSidebar({ result, onSelectRemoteJid, selectedJid }: ChatSidebarProps) {

    const [q, setQ] = useState("");
    const [tab, setTab] = useState<"all" | "dm" | "groups">("all");
    
    // Hook para el almacenamiento local de mensajes vistos
    const [seenMessages, setSeenMessages] = useLocalStorageObjectArray('seenMessages', [] as MessageRecord[]);


    // FUNCIÓN PARA MARCAR UN MENSAJE COMO VISTO (Guarda el remoteJid y el messageId)
    const markMessageAsSeen = useCallback((remoteJid: string, messageId: string) => {
        if (!remoteJid || !messageId) return;

        setSeenMessages(prevMsgs => {
            // Remueve el registro anterior para este chat (remoteJid)
            const filtered = prevMsgs.filter(m => m.userId !== remoteJid);
            
            // Agrega el nuevo registro del último mensaje visto
            const newRecord: MessageRecord = { userId: remoteJid, messageId };
            return [...filtered, newRecord];
        });
        
    }, [setSeenMessages]);
    
    // FUNCIÓN PARA COMPROBAR SI UN MENSAJE FUE VISTO LOCALMENTE
    const isMessageSeen = useCallback((remoteJid: string, messageId: string) => {
        if (!messageId) return false; 
        
        const record = seenMessages.find(m => m.userId === remoteJid);
        
        // Es visto si el ID guardado coincide con el ID del último mensaje
        return record?.messageId === messageId;

    }, [seenMessages]);


    const contacts = useMemo(() => {
        if (!result.success) return [];
        
        const mappedContacts = result.data.map((c) => {
            const ts = epochToMs(c.lastMessage?.messageTimestamp);
            const lastMsgData = lastTextFrom(c); 
            const lastMessageId = lastMsgData.id;
            
            // --- NUEVA LÓGICA DE LECTURA COMBINADA ---
            const isFromMe = lastMsgData.fromMe; // 1. Fue enviado por mí
            const isSelected = c.remoteJid === selectedJid; // 2. Es el chat seleccionado
            const wasSeenPreviously = lastMessageId ? isMessageSeen(c.remoteJid, lastMessageId) : false; // 3. Visto previamente

            // El chat se considera LEÍDO si CUALQUIERA de estas condiciones es verdadera:
            const isRead = wasSeenPreviously || isFromMe || isSelected;

            // Es NO LEÍDO localmente si NO está marcado como leído por la lógica combinada.
            const isUnreadLocal = lastMessageId ? !isRead : false;
            
            return {
                id: c.remoteJid,
                name: nameFrom(c),
                avatarSrc: avatarFrom(c),
                lastMessage: lastMsgData.text,
                lastMessageId: lastMessageId,
                messageType: lastMsgData.messageType,
                timestamp: formatTimeFromEpoch(c.lastMessage?.messageTimestamp),
                ts,
                isGroup: isGroupJid(c.remoteJid),
                isUnreadLocal: isUnreadLocal, // Bandera de estado de lectura local
            };
        })
            .sort((a, b) => b.ts - a.ts);

        // Al seleccionar, marcamos el último mensaje del chat como visto
        // Esto lo hacemos en handleSelectJid para persistencia, pero el useMemo
        // se recalcula inmediatamente debido a la dependencia [selectedJid]
        
        return mappedContacts;
    }, [result, isMessageSeen, selectedJid]); // <-- selectedJid es la clave para la re-evaluación instantánea


    const filtered = useMemo(() => {
        let list = contacts;

        if (tab === "dm") {
            list = contacts.filter((c) => !c.isGroup);
        }
        if (tab === "groups") {
            list = contacts.filter((c) => c.isGroup);
        }

        if (q.trim()) {
            const term = q.trim().toLowerCase();
            list = list.filter(
                (c) =>
                    c.name.toLowerCase().includes(term) ||
                    c.id.toLowerCase().includes(term) ||
                    c.lastMessage.toLowerCase().includes(term)
            );
        }

        return list.slice().sort((a, b) => b.ts - a.ts);
    }, [contacts, q, tab]);

    // Lógica para seleccionar JID y marcar como visto (persistencia)
    const handleSelectJid = useCallback((jid: string, lastMessageId: string) => {
        
        // Al seleccionar, marcamos el último mensaje del chat como visto, 
        // lo que persistirá el estado "leído" en localStorage para el futuro.
        if (jid && lastMessageId) {
            markMessageAsSeen(jid, lastMessageId);
        }

        if (onSelectRemoteJid) {
            onSelectRemoteJid(jid);
        }
    }, [onSelectRemoteJid, markMessageAsSeen]);


    return (
        <aside className="flex h-full w-full xs:min-w-[200px] max-w-[700px] flex-col border-r bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/50">
            {/* Top bar, Search, y Tabs (Mismo código) */}
            <div className="sticky top-0 z-10 space-y-3 border-b bg-background/70 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/50">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold tracking-tight">Chats</h1>
                    <Inbox className="text-muted-foreground h-5 w-5" aria-hidden />
                </div>
                {/* Search */}
                <div className="relative">
                    <Search className="text-muted-foreground absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar por nombre o mensaje…"
                        className="pl-8 pr-8"
                        aria-label="Buscar chats"
                    />
                    {q && (
                        <button
                            aria-label="Limpiar búsqueda"
                            className="text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => setQ("")}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                {/* Tabs */}
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => setTab("all")}
                        className={cn(
                            "inline-flex items-center justify-center gap-2 rounded-xl border text-sm transition",
                            tab === "all" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                        )}
                    >
                        <Inbox className="h-4 w-4" /> Todos
                    </button>
                    <button
                        onClick={() => setTab("dm")}
                        className={cn(
                            "inline-flex items-center justify-center gap-2 rounded-xl border text-sm transition",
                            tab === "dm" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                        )}
                    >
                        Privados
                    </button>
                    <button
                        onClick={() => setTab("groups")}
                        className={cn(
                            "inline-flex items-center justify-center gap-2 rounded-xl border text-sm transition",
                            tab === "groups" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                        )}
                    >
                        Grupos
                    </button>
                </div>
            </div>


            {/* Listado */}
            <div role="list" className="flex-1 space-y-1 overflow-y-auto p-1">
                {result.success && filtered.length > 0 ? (
                    filtered.map((c) => {
                        const IconComponent: React.ElementType | null = getIconForMessageType(c.messageType);
                        
                        // Determina si el chat se considera NO LEÍDO localmente
                        const isUnread = c.isUnreadLocal; 

                        return (
                            <button
                                key={c.id}
                                role="listitem"
                                // El handler marca el mensaje como visto al hacer clic
                                onClick={() => handleSelectJid(c.id, c.lastMessageId)} 
                                className={cn(
                                    "group flex w-full items-center gap-3 rounded-xl border p-2 text-left transition hover:bg-accent hover:text-accent-foreground",
                                    selectedJid === c.id ? "border-primary bg-primary/10" : "border-transparent"
                                )}
                                aria-current={selectedJid === c.id ? "true" : "false"}
                            >
                                <div className="relative">
                                    <Avatar className="h-10 w-10 ring-2 ring-background group-hover:ring-accent">
                                        <AvatarImage src={c.avatarSrc} alt={c.name || "Contacto"} />
                                        <AvatarFallback>{c.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                                    </Avatar>
                                    {c.isGroup && (
                                        <Users className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full bg-background/90 p-[2px] text-muted-foreground ring-1 ring-border" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        {/* Nombre resaltado si no es leído */}
                                        <span className={cn("truncate font-medium text-sm", isUnread && "text-foreground")}>
                                            {c.name || "Sin nombre"}
                                        </span>
                                        <span className="text-muted-foreground shrink-0 text-xs">
                                            {c.timestamp}
                                        </span>
                                    </div>
                                    <div className="mt-0.5 flex items-center justify-between gap-2">
                                        {/* Último mensaje resaltado si no es leído */}
                                        <p className={cn("truncate text-sm flex items-center gap-1", 
                                            isUnread ? "text-foreground font-semibold" : "text-muted-foreground"
                                        )}>
                                            {IconComponent && (
                                                <IconComponent className="h-4 w-4 flex-shrink-0 text-muted-foreground opacity-70" />
                                            )}
                                            <span>{c.lastMessage || "—"}</span>
                                        </p>
                                        
                                        {/* Indicador visual de NO LEÍDO (Punto) */}
                                        {isUnread && (
                                            <span className="bg-primary inline-block h-2 w-2 rounded-full shrink-0"></span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        )
                    })
                ) : (
                    <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                        <div className="rounded-2xl border p-6 opacity-70">
                            <Inbox className="h-8 w-8" />
                        </div>
                        <p className="text-sm">
                            {result.success ? "No hay chats que coincidan con el filtro." : result.message || "No disponible."}
                        </p>
                    </div>
                )}
            </div>
        </aside>
    );
}
"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// 1. IMPORTAMOS LOS ICONOS NECESARIOS (MessageSquare es para texto por defecto)
import { Search, Users, Inbox, X, Image as ImageIcon, Video, FileText, AudioLines, Mic, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
// Importamos LucideIcon para tipado
import { LucideIcon } from "lucide-react";

/* ---------- Tipos del fetch ---------- */
// NOTA: Se ha modificado el tipo LastMessage para incluir el messageType en el objeto que se mapea.
type LastMessage = {
    message?: { conversation?: string };
    messageTimestamp?: number;
    messageType?: string;
};
type ChatData = {
    remoteJid: string;
    pushName: string | null;
    profilePicUrl: string | null;
    lastMessage: LastMessage | null;
    unreadCount: number;
};
export type FetchChatsResult =
    | { success: true; message: string; data: ChatData[] }
    | { success: false; message: string };

/* ---------- Props ---------- */
type ChatSidebarProps = {
    result: FetchChatsResult;
    onSelectRemoteJid?: (remoteJid: string) => void | Promise<void>;
    selectedJid?: string;
};

/* ---------- Helpers ---------- */
function epochToMs(epoch?: number): number {
    if (!epoch) return 0;
    return epoch < 2_000_000_000 ? epoch * 1000 : epoch; // soporta segundos/ms
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
    // LOG: Si no hay pushName, usamos parte del JID.
    
    return jid.includes("@") ? jid.split("@")[0] : jid;
}

// 2. NUEVA FUNCIÓN HELPER: Mapea el messageType a un Icono de Lucide.
function getIconForMessageType(type?: string): LucideIcon | null {
    if (!type) return null;

    // Mapeo basado en Evolution Message Types (ajusta según tus necesidades)
    switch (type) {
        case 'conversation':
        case 'extendedTextMessage':
            return null; // Texto no necesita icono, o usa MessageSquare si lo prefieres
        case 'imageMessage':
            return ImageIcon;
        case 'videoMessage':
            return Video;
        case 'audioMessage':
            return Mic; // Usamos Mic para notas de voz/archivos de audio
        case 'documentMessage': // fileMessage se traduce a documentMessage en la mayoría de los casos
        case 'fileMessage':
            return FileText;
        case 'locationMessage':
            return MessageSquare; // Ejemplo: Si no tienes un icono de ubicación
        default:
            // LOG: Mensajes de tipo no mapeado

            return null;
    }
}

// 3. MODIFICACIÓN DE lastTextFrom: Devuelve el texto y el tipo de mensaje.
function lastTextFrom(chat: ChatData): { text: string; messageType?: string } {
    const msg = chat.lastMessage?.message;
    const type = chat.lastMessage?.messageType;
    let text = "";

    if (!msg) {
        text = "";
    } else if (msg.conversation) {
        text = msg.conversation;
    } else {
        // Asignar un texto representativo basado en el tipo
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

    return { text, messageType: type };
}

function avatarFrom(chat: ChatData): string {
    return chat.profilePicUrl || "/placeholder.svg?height=40&width=40";
}
function isGroupJid(jid: string) {
    return jid?.includes("@g.us");
}

/* ---------- UI ---------- */
export function ChatSidebar({ result, onSelectRemoteJid, selectedJid }: ChatSidebarProps) {
    const [q, setQ] = useState("");
    const [tab, setTab] = useState<"all" | "dm" | "groups">("all");

    // LOG: Efecto para ver el montaje y las props iniciales
    useEffect(() => {


        if (!result.success) {
            console.error(`[CSB] ❌ Error en el fetch inicial: ${result.message}`);
        }
    }, [result.success, selectedJid, result.success ? result.data.length : 0]);

   


    const contacts = useMemo(() => {
        // LOG: Seguimiento de cuándo se recalcula la lista base


        if (!result.success) return [];

        const mappedContacts = result.data.map((c) => {
            const ts = epochToMs(c.lastMessage?.messageTimestamp); // ← numérico para ordenar
            const lastMsgData = lastTextFrom(c); // Obtener datos del último mensaje
            return {
                id: c.remoteJid,
                name: nameFrom(c),
                avatarSrc: avatarFrom(c),
                lastMessage: lastMsgData.text, // El texto formateado
                messageType: lastMsgData.messageType, // El tipo de mensaje para el icono
                timestamp: formatTimeFromEpoch(c.lastMessage?.messageTimestamp),
                ts, // ← clave para sort
                hasUnread: (c.unreadCount ?? 0) > 0,
                unreadCount: c.unreadCount ?? 0,
                isGroup: isGroupJid(c.remoteJid),
            };
        })
            // ✅ ORDEN PRINCIPAL: por fecha/hora (descendente)
            .sort((a, b) => b.ts - a.ts);


        return mappedContacts;
    }, [result]);

    const filtered = useMemo(() => {
        // LOG: Seguimiento de cuándo se recalcula la lista filtrada


        let list = contacts;

        // 1. Filtrado por pestaña
        if (tab === "dm") {
            list = contacts.filter((c) => !c.isGroup);

        }
        if (tab === "groups") {
            list = contacts.filter((c) => c.isGroup);

        }

        // 2. Filtrado por búsqueda
        if (q.trim()) {
            const term = q.trim().toLowerCase();
            const initialLength = list.length;
            list = list.filter(
                (c) =>
                    c.name.toLowerCase().includes(term) ||
                    c.id.toLowerCase().includes(term) ||
                    c.lastMessage.toLowerCase().includes(term)
            );

        }

        // Mantén el orden por fecha/hora tras filtrar
        return list.slice().sort((a, b) => b.ts - a.ts);
    }, [contacts, q, tab]);

    // LOG: función para el clic
    const handleSelectJid = useCallback((jid: string) => {

        if (onSelectRemoteJid) {
            onSelectRemoteJid(jid);
        }
    }, [onSelectRemoteJid]);


    return (
        <aside className="flex w-[320px] min-w-[280px] max-w-[360px] flex-col border-r bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/50">
            {/* Top bar */}
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
                        onChange={(e) => {
                            // LOG: Cambio de búsqueda

                            setQ(e.target.value);
                        }}
                        placeholder="Buscar por nombre o mensaje…"
                        className="pl-8 pr-8"
                        aria-label="Buscar chats"
                    />
                    {q && (
                        <button
                            aria-label="Limpiar búsqueda"
                            className="text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => {

                                setQ("");
                            }}
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
                        // Obtener el componente Icono para este chat
                        const IconComponent = getIconForMessageType(c.messageType);

                        return (
                            <button
                                key={c.id}
                                role="listitem"
                                onClick={() => handleSelectJid(c.id)} // Usar el handler con log
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
                                        <span className="truncate font-medium text-sm">{c.name || "Sin nombre"}</span>
                                        <span className="text-muted-foreground shrink-0 text-xs">
                                            {c.timestamp}
                                        </span>
                                    </div>
                                    <div className="mt-0.5 flex items-center justify-between gap-2">
                                        {/* 4. RENDERIZADO DEL ICONO */}
                                        <p className="text-muted-foreground truncate text-sm flex items-center gap-1">
                                            {IconComponent && (
                                                <IconComponent className="h-4 w-4 flex-shrink-0 text-muted-foreground opacity-70" />
                                            )}
                                            <span>{c.lastMessage || "—"}</span>
                                        </p>
                                         {c.unreadCount > 0 && (
     <span className="bg-primary text-primary-foreground inline-flex h-2 min-w-2 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
     
     </span>
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
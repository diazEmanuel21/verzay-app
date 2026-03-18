"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Search,
    Users,
    Inbox,
    X,
    Image as ImageIcon,
    Video,
    FileText,
    Mic,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { ChatData, FetchChatsResult } from "@/actions/chat-actions";
import { useLocalStorageObjectArray, MessageRecord } from "@/hooks/chats/useSeenMessages";
import { SessionTagsCombobox } from "../../tags/components";
import type { ChatContactSessionMap, SimpleTag } from "@/types/session";

type ChatSidebarProps = {
    allTags: SimpleTag[];
    chatSessions: ChatContactSessionMap;
    onSessionTagsChange?: (remoteJid: string, selectedIds: number[]) => void;
    result: FetchChatsResult;
    onSelectRemoteJid?: (remoteJid: string) => void | Promise<void>;
    selectedJid?: string;
};

const CHAT_TIME_FORMATTER = new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Bogota",
});

function epochToMs(epoch?: number): number {
    if (!epoch) return 0;
    return epoch < 2_000_000_000 ? epoch * 1000 : epoch;
}

function formatTimeFromEpoch(epoch?: number): string {
    const ms = epochToMs(epoch);
    if (!ms) return "";
    return CHAT_TIME_FORMATTER.format(new Date(ms));
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
        case "conversation":
        case "extendedTextMessage":
            return null;
        case "imageMessage":
            return ImageIcon;
        case "videoMessage":
            return Video;
        case "audioMessage":
            return Mic;
        case "documentMessage":
        case "fileMessage":
            return FileText;
        case "locationMessage":
            return null;
        default:
            return null;
    }
}

function lastTextFrom(chat: ChatData): {
    text: string;
    messageType?: string;
    id: string;
    fromMe: boolean;
} {
    const msg = chat.lastMessage?.message;
    const type = chat.lastMessage?.messageType;
    const id = chat.lastMessage?.key.id ?? "";
    const fromMe = chat.lastMessage?.key.fromMe ?? false;
    let text = "";

    if (!msg) {
        text = "";
    } else if (msg.conversation) {
        text = msg.conversation;
    } else {
        switch (type) {
            case "imageMessage":
                text = "Imagen";
                break;
            case "videoMessage":
                text = "Video";
                break;
            case "audioMessage":
                text = "Nota de voz";
                break;
            case "documentMessage":
            case "fileMessage":
                text = "Documento";
                break;
            case "locationMessage":
                text = "Ubicacion";
                break;
            default:
                text = `[${type || "Mensaje desconocido"}]`;
                break;
        }
    }

    return { text, messageType: type, id, fromMe };
}

function avatarFrom(chat: ChatData): string {
    return chat.profilePicUrl || "/placeholder.svg?height=40&width=40";
}

function isGroupJid(jid: string) {
    return jid?.includes("@g.us");
}

export function ChatSidebar({
    allTags,
    chatSessions,
    onSessionTagsChange,
    result,
    onSelectRemoteJid,
    selectedJid,
}: ChatSidebarProps) {
    const [q, setQ] = useState("");
    const [tab, setTab] = useState<"all" | "dm" | "groups">("all");
    const [seenMessages, setSeenMessages] = useLocalStorageObjectArray("seenMessages", [] as MessageRecord[]);

    const markMessageAsSeen = useCallback((remoteJid: string, messageId: string) => {
        if (!remoteJid || !messageId) return;

        setSeenMessages((prevMsgs) => {
            const filtered = prevMsgs.filter((message) => message.userId !== remoteJid);
            const newRecord: MessageRecord = { userId: remoteJid, messageId };
            return [...filtered, newRecord];
        });
    }, [setSeenMessages]);

    const isMessageSeen = useCallback((remoteJid: string, messageId: string) => {
        if (!messageId) return false;

        const record = seenMessages.find((message) => message.userId === remoteJid);
        return record?.messageId === messageId;
    }, [seenMessages]);

    const contacts = useMemo(() => {
        if (!result.success) return [];

        return result.data
            .map((chat) => {
                const ts = epochToMs(chat.lastMessage?.messageTimestamp);
                const lastMsgData = lastTextFrom(chat);
                const lastMessageId = lastMsgData.id;

                const isFromMe = lastMsgData.fromMe;
                const isSelected = chat.remoteJid === selectedJid;
                const wasSeenPreviously = lastMessageId
                    ? isMessageSeen(chat.remoteJid, lastMessageId)
                    : false;
                const hasUnreadFromServer = (chat.unreadCount ?? 0) > 0;
                const isRead = wasSeenPreviously || isFromMe || isSelected || !hasUnreadFromServer;

                return {
                    id: chat.remoteJid,
                    name: nameFrom(chat),
                    avatarSrc: avatarFrom(chat),
                    chatSession: chatSessions[chat.remoteJid] ?? null,
                    lastMessage: lastMsgData.text,
                    lastMessageId,
                    messageType: lastMsgData.messageType,
                    timestamp: formatTimeFromEpoch(chat.lastMessage?.messageTimestamp),
                    ts,
                    isGroup: isGroupJid(chat.remoteJid),
                    isUnreadLocal: Boolean(lastMessageId) && !isRead,
                };
            })
            .sort((a, b) => b.ts - a.ts);
    }, [chatSessions, isMessageSeen, result, selectedJid]);

    const filtered = useMemo(() => {
        let list = contacts;

        if (tab === "dm") {
            list = contacts.filter((contact) => !contact.isGroup);
        }

        if (tab === "groups") {
            list = contacts.filter((contact) => contact.isGroup);
        }

        if (q.trim()) {
            const term = q.trim().toLowerCase();
            list = list.filter(
                (contact) =>
                    contact.name.toLowerCase().includes(term) ||
                    contact.id.toLowerCase().includes(term) ||
                    contact.lastMessage.toLowerCase().includes(term) ||
                    (contact.chatSession?.tags ?? []).some((tag) =>
                        tag.name.toLowerCase().includes(term),
                    ),
            );
        }

        return list.slice().sort((a, b) => b.ts - a.ts);
    }, [contacts, q, tab]);

    const handleSelectJid = useCallback((jid: string, lastMessageId: string) => {
        if (jid && lastMessageId) {
            markMessageAsSeen(jid, lastMessageId);
        }

        onSelectRemoteJid?.(jid);
    }, [markMessageAsSeen, onSelectRemoteJid]);

    return (
        <aside className="flex h-full w-full max-w-[700px] flex-col border-r bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/50 xs:min-w-[200px]">
            <div className="sticky top-0 z-10 space-y-3 border-b bg-background/70 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/50">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold tracking-tight">Chats</h1>
                    <Inbox className="h-5 w-5 text-muted-foreground" aria-hidden />
                </div>

                <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar por nombre, mensaje o etiqueta..."
                        className="pl-8 pr-8"
                        aria-label="Buscar chats"
                    />
                    {q && (
                        <button
                            type="button"
                            aria-label="Limpiar busqueda"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                            onClick={() => setQ("")}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() => setTab("all")}
                        className={cn(
                            "inline-flex items-center justify-center gap-2 rounded-xl border text-sm transition",
                            tab === "all" ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                        )}
                    >
                        <Inbox className="h-4 w-4" /> Todos
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("dm")}
                        className={cn(
                            "inline-flex items-center justify-center gap-2 rounded-xl border text-sm transition",
                            tab === "dm" ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                        )}
                    >
                        Privados
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("groups")}
                        className={cn(
                            "inline-flex items-center justify-center gap-2 rounded-xl border text-sm transition",
                            tab === "groups" ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                        )}
                    >
                        Grupos
                    </button>
                </div>
            </div>

            <div role="list" className="flex-1 space-y-1 overflow-y-auto p-1">
                {result.success && filtered.length > 0 ? (
                    filtered.map((contact) => {
                        const IconComponent = getIconForMessageType(contact.messageType);
                        const isUnread = contact.isUnreadLocal;
                        const selected = selectedJid === contact.id;

                        return (
                            <div
                                key={contact.id}
                                role="listitem"
                                className={cn(
                                    "group rounded-xl border p-2 transition hover:bg-accent hover:text-accent-foreground",
                                    selected ? "border-primary bg-primary/10" : "border-transparent",
                                )}
                                aria-current={selected ? "true" : "false"}
                            >
                                <button
                                    type="button"
                                    onClick={() => handleSelectJid(contact.id, contact.lastMessageId)}
                                    className="flex w-full items-center gap-3 text-left"
                                >
                                    <div className="relative">
                                        <Avatar className="h-10 w-10 ring-2 ring-background group-hover:ring-accent">
                                            <AvatarImage src={contact.avatarSrc} alt={contact.name || "Contacto"} />
                                            <AvatarFallback>{contact.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                                        </Avatar>
                                        {contact.isGroup && (
                                            <Users className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background/90 p-[2px] text-muted-foreground ring-1 ring-border" />
                                        )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={cn("truncate text-sm font-medium", isUnread && "text-foreground")}>
                                                {contact.name || "Sin nombre"}
                                            </span>
                                            <span className="shrink-0 text-xs text-muted-foreground">
                                                {contact.timestamp}
                                            </span>
                                        </div>
                                            <div className="mt-0.5 flex items-center justify-between gap-2">
                                                <div
                                                    className={cn(
                                                        "flex items-center gap-1 truncate text-sm",
                                                        isUnread ? "font-semibold text-foreground" : "text-muted-foreground",
                                                    )}
                                                >
                                                    {IconComponent && (
                                                        <IconComponent className="h-4 w-4 flex-shrink-0 text-muted-foreground opacity-70" />
                                                    )}
                                                    <span>{contact.lastMessage || "—"}</span>
                                                </div>

                                                {isUnread && (
                                                    <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    {contact.chatSession && (
                                        <div className="pl-[52px] pt-2">
                                            <SessionTagsCombobox
                                                userId={contact.chatSession.userId}
                                                sessionId={contact.chatSession.id}
                                                allTags={allTags}
                                                initialSelectedIds={contact.chatSession.tags.map((tag) => tag.id)}
                                                onSelectedIdsChange={(selectedIds) =>
                                                    onSessionTagsChange?.(contact.id, selectedIds)
                                                }
                                            />
                                        </div>
                                    )}


                            </div>
                        );
                    })
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
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

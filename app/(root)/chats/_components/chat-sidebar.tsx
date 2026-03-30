"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  Archive,
  FileText,
  Image as ImageIcon,
  Inbox,
  Mic,
  MoreVertical,
  Pin,
  RotateCcw,
  Search,
  Trash2,
  Video,
  X,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { extractWhatsAppDigits } from "@/lib/whatsapp-jid";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SessionTagsTooltip } from "../../tags/components";
import { LeadStatusBadge } from "../../crm/dashboard/components/records-table/LeadStatusBadge";
import { FlowListOrder } from "../../sessions/_components/FlowListOrder";
import { cn } from "@/lib/utils";
import type { FetchChatsResult, ChatData } from "@/actions/chat-actions";
import { useLocalStorageObjectArray, MessageRecord } from "@/hooks/chats/useSeenMessages";
import type { ChatConversationPreferenceMap } from "@/types/chat";
import type { ChatContactSessionMap } from "@/types/session";

type ChatSidebarProps = {
  chatPreferences: ChatConversationPreferenceMap;
  chatSessions: ChatContactSessionMap;
  onArchiveChat?: (remoteJid: string, archived: boolean) => void | Promise<void>;
  onDeleteChat?: (remoteJid: string) => void | Promise<void>;
  onRestoreChat?: (remoteJid: string) => void | Promise<void>;
  onSelectRemoteJid?: (remoteJid: string) => void | Promise<void>;
  onTogglePin?: (remoteJid: string, isPinned: boolean) => void | Promise<void>;
  result: FetchChatsResult;
  selectedJid?: string;
};

type SidebarContact = {
  id: string;
  chatSession: ChatContactSessionMap[string] | null;
  isArchived: boolean;
  isDeleted: boolean;
  isGroup: boolean;
  isPinned: boolean;
  isUnreadLocal: boolean;
  lastMessage: string;
  lastMessageId: string;
  messageType?: string;
  name: string;
  avatarSrc: string;
  pinnedAtMs: number;
  timestamp: string;
  ts: number;
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
  const base = jid.includes("@") ? jid.split("@")[0] : jid;
  const digits = extractWhatsAppDigits(jid);
  const indicativo = digits && digits.length > 10 ? `+${digits.slice(0, digits.length - 10)}` : "";

  return indicativo ? `${base} (${indicativo})` : base;
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
    case "stickerMessage":
      return ImageIcon;
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
      case "stickerMessage":
        text = "Sticker";
        break;
      case "reactionMessage": {
        const emoji = (msg as any)?.reactionMessage?.text;
        text = emoji ? `Reaccionó: ${emoji}` : "Reaccion";
        break;
      }
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
  chatPreferences,
  chatSessions,
  onArchiveChat,
  onDeleteChat,
  onRestoreChat,
  onSelectRemoteJid,
  onTogglePin,
  result,
  selectedJid,
}: ChatSidebarProps) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "dm" | "groups" | "archived" | "deleted">("all");
  const [deleteTarget, setDeleteTarget] = useState<SidebarContact | null>(null);
  const [seenMessages, setSeenMessages] = useLocalStorageObjectArray(
    "seenMessages",
    [] as MessageRecord[],
  );

  const markMessageAsSeen = useCallback(
    (remoteJid: string, messageId: string) => {
      if (!remoteJid || !messageId) return;

      setSeenMessages((previousMessages) => {
        const filtered = previousMessages.filter((message) => message.userId !== remoteJid);
        const newRecord: MessageRecord = { userId: remoteJid, messageId };
        return [...filtered, newRecord];
      });
    },
    [setSeenMessages],
  );

  const isMessageSeen = useCallback(
    (remoteJid: string, messageId: string) => {
      if (!messageId) return false;
      const record = seenMessages.find((message) => message.userId === remoteJid);
      return record?.messageId === messageId;
    },
    [seenMessages],
  );

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
        const preference = chatPreferences[chat.remoteJid];

        return {
          id: chat.remoteJid,
          chatSession: chatSessions[chat.remoteJid] ?? null,
          name: chatSessions[chat.remoteJid]?.pushName?.trim() || nameFrom(chat),
          avatarSrc: avatarFrom(chat),
          lastMessage: lastMsgData.text,
          lastMessageId,
          messageType: lastMsgData.messageType,
          timestamp: formatTimeFromEpoch(chat.lastMessage?.messageTimestamp),
          ts,
          isGroup: isGroupJid(chat.remoteJid),
          isUnreadLocal: Boolean(lastMessageId) && !isRead,
          isPinned: Boolean(preference?.isPinned),
          pinnedAtMs: preference?.pinnedAt ? new Date(preference.pinnedAt).getTime() : 0,
          isArchived: Boolean(preference?.isArchived),
          isDeleted: Boolean(preference?.isDeleted),
        } satisfies SidebarContact;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return Number(b.isPinned) - Number(a.isPinned);
        if (a.pinnedAtMs !== b.pinnedAtMs) return b.pinnedAtMs - a.pinnedAtMs;
        return b.ts - a.ts;
      });
  }, [chatPreferences, chatSessions, isMessageSeen, result, selectedJid]);

  const tabCounts = useMemo(() => {
    const active = contacts.filter((c) => !c.isDeleted && !c.isArchived);
    return {
      all: active.length,
      dm: active.filter((c) => !c.isGroup).length,
      groups: active.filter((c) => c.isGroup).length,
      archived: contacts.filter((c) => !c.isDeleted && c.isArchived).length,
      deleted: contacts.filter((c) => c.isDeleted).length,
    };
  }, [contacts]);

  const deletedContacts = useMemo(() => {
    let list = contacts.filter((contact) => contact.isDeleted);

    if (q.trim()) {
      const term = q.trim().toLowerCase();
      list = list.filter(
        (contact) =>
          contact.name.toLowerCase().includes(term) ||
          contact.id.toLowerCase().includes(term) ||
          contact.lastMessage.toLowerCase().includes(term),
      );
    }

    return list.slice().sort((a, b) => b.ts - a.ts);
  }, [contacts, q]);

  const filtered = useMemo(() => {
    if (tab === "deleted") return [];

    let list = contacts.filter((contact) => !contact.isDeleted);

    if (tab === "archived") {
      list = list.filter((contact) => contact.isArchived);
    } else {
      list = list.filter((contact) => !contact.isArchived);

      if (tab === "dm") {
        list = list.filter((contact) => !contact.isGroup);
      }

      if (tab === "groups") {
        list = list.filter((contact) => contact.isGroup);
      }
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

    return list.slice().sort((a, b) => {
      if (a.isPinned !== b.isPinned) return Number(b.isPinned) - Number(a.isPinned);
      if (a.pinnedAtMs !== b.pinnedAtMs) return b.pinnedAtMs - a.pinnedAtMs;
      return b.ts - a.ts;
    });
  }, [contacts, q, tab]);

  // Scroll to selected chat when selectedJid changes
  React.useEffect(() => {
    if (selectedJid) {
      const selectedElement = document.querySelector(`[data-chat-id="${selectedJid}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedJid]);

  const handleSelectJid = useCallback(
    (jid: string, lastMessageId: string) => {
      if (jid && lastMessageId) {
        markMessageAsSeen(jid, lastMessageId);
      }

      onSelectRemoteJid?.(jid);
    },
    [markMessageAsSeen, onSelectRemoteJid],
  );

  const emptyMessage =
    tab === "archived"
      ? "No hay chats archivados que coincidan con el filtro."
      : tab === "deleted"
        ? "No hay chats eliminados."
        : "No hay chats que coincidan con el filtro.";

  return (
    <>
      <aside className="flex h-full w-full max-w-[700px] flex-col border-r bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/50 xs:min-w-[200px]">
        <div className="sticky top-0 z-10 space-y-2 border-b bg-background/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* Fila 1: título + buscador */}
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm font-bold tracking-tight text-foreground">Chats</span>
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Buscar..."
                className="h-8 rounded-full pl-7 pr-7 text-xs"
                aria-label="Buscar chats"
              />
              {q && (
                <button
                  type="button"
                  aria-label="Limpiar busqueda"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setQ("")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Fila 2: tabs */}
          {(() => {
            const TAB_CONFIG: {
              key: "all" | "dm" | "groups" | "archived" | "deleted";
              label: string;
              Icon: LucideIcon | null;
              color: string;
              count: number;
            }[] = [
              { key: "all",      label: "Todos",  Icon: Inbox,   color: "#007BFF", count: tabCounts.all },
              // { key: "dm",       label: "Priv.",  Icon: null,    color: "#6366F1", count: tabCounts.dm },
              { key: "groups",   label: "Grupos", Icon: Users,   color: "#28A745", count: tabCounts.groups },
              { key: "archived", label: "Arch.",  Icon: Archive, color: "#6C757D", count: tabCounts.archived },
              { key: "deleted",  label: "Elim.",  Icon: Trash2,  color: "#DC3545", count: tabCounts.deleted },
            ];
            return (
              <div className="flex flex-row gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TAB_CONFIG.map(({ key, label, Icon, color, count }) => {
                  const isActive = tab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap transition-all"
                      style={
                        isActive
                          ? { background: color, borderColor: color, color: "#fff" }
                          : { borderColor: `${color}50`, color, background: `${color}10` }
                      }
                    >
                      {Icon && <Icon className="h-3 w-3 shrink-0" />}
                      <span>{label}</span>
                      {count > 0 && (
                        <span
                          className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[9px] font-bold leading-none text-white"
                          style={{ background: isActive ? "rgba(255,255,255,0.3)" : color }}
                        >
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        <div role="list" className="flex-1 space-y-1 overflow-y-auto p-1">
          {tab === "deleted" ? (
            deletedContacts.length > 0 ? (
              <>
                <p className="px-2 py-1 text-xs text-muted-foreground">
                  {deletedContacts.length} chat{deletedContacts.length !== 1 ? "s" : ""} eliminado{deletedContacts.length !== 1 ? "s" : ""}
                </p>
                {deletedContacts.map((contact) => {
                  const IconComponent = getIconForMessageType(contact.messageType);
                  return (
                    <div
                      key={contact.id}
                      role="listitem"
                      className="group rounded-xl border border-transparent p-2 transition hover:bg-accent hover:text-accent-foreground"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <Avatar className="h-10 w-10 opacity-60 ring-2 ring-background group-hover:ring-accent">
                            <AvatarImage src={contact.avatarSrc} alt={contact.name || "Contacto"} />
                            <AvatarFallback>
                              {contact.name?.charAt(0)?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="shrink-0 text-sm font-bold text-muted-foreground">
                                {contact.name || "Sin nombre"}
                              </span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {contact.timestamp}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                              {IconComponent && (
                                <IconComponent className="h-4 w-4 shrink-0 opacity-70" />
                              )}
                              <span>{contact.lastMessage || "-"}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Restaurar chat"
                          className="h-8 w-8 shrink-0 rounded-full text-green-600 hover:bg-green-50 hover:text-green-700"
                          onClick={(event) => {
                            event.stopPropagation();
                            void onRestoreChat?.(contact.id);
                          }}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
                <div className="rounded-2xl border p-6 opacity-70">
                  <Trash2 className="h-8 w-8" />
                </div>
                <p className="text-sm">{emptyMessage}</p>
              </div>
            )
          ) : result.success && filtered.length > 0 ? (
            filtered.map((contact) => {
              const IconComponent = getIconForMessageType(contact.messageType);
              const isUnread = contact.isUnreadLocal;
              const selected = selectedJid === contact.id;

              return (
                <div
                  key={contact.id}
                  role="listitem"
                  data-chat-id={contact.id}
                  className={cn(
                    "group rounded-xl border p-2 transition hover:bg-accent hover:text-accent-foreground",
                    selected ? "border-primary bg-primary/10" : "border-transparent",
                  )}
                  aria-current={selected ? "true" : "false"}
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectJid(contact.id, contact.lastMessageId)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10 ring-2 ring-background group-hover:ring-accent">
                          <AvatarImage src={contact.avatarSrc} alt={contact.name || "Contacto"} />
                          <AvatarFallback>
                            {contact.name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        {contact.isGroup && (
                          <Users className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background/90 p-[2px] text-muted-foreground ring-1 ring-border" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Row 1: name + tags + timestamp */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                            {contact.isPinned && (
                              <Pin className="h-3.5 w-3.5 shrink-0 fill-current text-amber-500" />
                            )}
                            {contact.isArchived && (
                              <Archive className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                            <span
                              className={cn(
                                "shrink-0 text-sm font-bold",
                                isUnread && "text-foreground",
                              )}
                            >
                              {contact.name || "Sin nombre"}
                            </span>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {contact.timestamp}
                          </span>
                        </div>

                        {/* Row 2: lead status badge */}
                        <div className="mt-0.5 flex gap-1">
                          <LeadStatusBadge status={contact.chatSession?.leadStatus ?? null} />
                              {contact.chatSession && (
                            <FlowListOrder raw={contact.chatSession.flujos ?? ""} />
                          )}
                          {contact.chatSession && contact.chatSession.tags.length > 0 && (
                            <SessionTagsTooltip tags={contact.chatSession.tags} maxVisible={5} />
                          )}
                        </div>

                        {/* Row 3: last message */}
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <div
                            className={cn(
                              "flex items-center gap-1 truncate text-sm",
                              isUnread
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {IconComponent && (
                              <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground opacity-70" />
                            )}
                            <span>{contact.lastMessage || "-"}</span>
                          </div>

                          {isUnread && (
                            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 rounded-full"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onSelect={(event) => {
                            event.preventDefault();
                            void onTogglePin?.(contact.id, !contact.isPinned);
                          }}
                        >
                          <Pin className="h-4 w-4" />
                          {contact.isPinned ? "Desanclar chat" : "Anclar chat"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(event) => {
                            event.preventDefault();
                            void onArchiveChat?.(contact.id, !contact.isArchived);
                          }}
                        >
                          <Archive className="h-4 w-4" />
                          {contact.isArchived ? "Restaurar chat" : "Archivar chat"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onSelect={(event) => {
                            event.preventDefault();
                            setDeleteTarget(contact);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar chat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
              <div className="rounded-2xl border p-6 opacity-70">
                <Inbox className="h-8 w-8" />
              </div>
              <p className="text-sm">
                {result.success ? emptyMessage : result.message || "No disponible."}
              </p>
            </div>
          )}
        </div>
      </aside>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar chat de tu bandeja</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `El chat con ${deleteTarget.name} se ocultara de tu bandeja principal. Esta accion no elimina mensajes del proveedor.`
                : "Esta accion ocultara el chat de tu bandeja principal."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (!deleteTarget) return;
                void onDeleteChat?.(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Eliminar chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

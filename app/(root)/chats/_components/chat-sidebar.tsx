"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, User2, Inbox, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/* ---------- Tipos del fetch ---------- */
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
  | { success: false, message: string };

/* ---------- Props ---------- */
type ChatSidebarProps = {
  result: FetchChatsResult;
  onSelectRemoteJid?: (remoteJid: string) => void | Promise<void>;
  selectedJid?: string;
};

/* ---------- Helpers ---------- */
function formatTimeFromEpoch(epoch?: number): string {
  if (!epoch) return "";
  const ms = epoch < 2_000_000_000 ? epoch * 1000 : epoch;
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function nameFrom(chat: ChatData): string {
  if (chat.pushName?.trim()) return chat.pushName;
  const jid = chat.remoteJid || "";
  return jid.includes("@") ? jid.split("@")[0] : jid;
}
function lastTextFrom(chat: ChatData): string {
  const msg = chat.lastMessage?.message;
  if (!msg) return "";
  if (msg.conversation) return msg.conversation;
  const t = chat.lastMessage?.messageType;
  return t ? `[${t}]` : "";
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

  const contacts = useMemo(() => {
    if (!result.success) return [];
    return result.data.map((c) => ({
      id: c.remoteJid,
      name: nameFrom(c),
      avatarSrc: avatarFrom(c),
      lastMessage: lastTextFrom(c),
      timestamp: formatTimeFromEpoch(c.lastMessage?.messageTimestamp),
      hasUnread: (c.unreadCount ?? 0) > 0,
      unreadCount: c.unreadCount ?? 0,
      isGroup: isGroupJid(c.remoteJid),
    }));
  }, [result]);

  const filtered = useMemo(() => {
    let list = contacts;
    if (tab === "dm") list = contacts.filter((c) => !c.isGroup);
    if (tab === "groups") list = contacts.filter((c) => c.isGroup);
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.id.toLowerCase().includes(term) ||
          c.lastMessage.toLowerCase().includes(term)
      );
    }
    // ordena por no leídos primero y luego por timestamp (desc)
    list = list.slice().sort((a, b) => {
      if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
      return (b.timestamp || "").localeCompare(a.timestamp || "");
    });
    return list;
  }, [contacts, q, tab]);

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
              "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
              tab === "all" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
            )}
          >
            <Inbox className="h-4 w-4" /> Todos
          </button>
          <button
            onClick={() => setTab("dm")}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
              tab === "dm" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
            )}
          >
            <User2 className="h-4 w-4" /> Privados
          </button>
          <button
            onClick={() => setTab("groups")}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
              tab === "groups" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
            )}
          >
            <Users className="h-4 w-4" /> Grupos
          </button>
        </div>
      </div>

      {/* Listado */}
      <div role="list" className="flex-1 space-y-1 overflow-y-auto p-3">
        {result.success && filtered.length > 0 ? (
          filtered.map((c) => (
            <button
              key={c.id}
              role="listitem"
              onClick={() => onSelectRemoteJid?.(c.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:bg-accent hover:text-accent-foreground",
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
                  <span className="truncate font-medium">{c.name || "Sin nombre"}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">{c.timestamp}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="text-muted-foreground truncate text-sm">{c.lastMessage || "—"}</p>
                  {c.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                      {c.unreadCount > 99 ? "99+" : c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
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

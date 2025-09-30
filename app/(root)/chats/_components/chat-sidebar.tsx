"use client";

import { useMemo, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

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
type FetchChatsResult =
  | { success: true; message: string; data: ChatData[] }
  | { success: false; message: string };

/* ---------- UI interna ---------- */
interface ChatContactProps {
  id: string;
  name: string;
  avatarSrc: string;
  lastMessage: string;
  timestamp: string;
  hasUnread: boolean;
  isActive: boolean;
  onClick: (id: string) => void;
}
const ChatContact = ({
  id,
  name,
  avatarSrc,
  lastMessage,
  timestamp,
  hasUnread,
  isActive,
  onClick,
}: ChatContactProps) => (
  <div
    className={cn(
      "hover:bg-muted flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors",
      isActive && "bg-muted"
    )}
    onClick={() => onClick(id)}
  >
    <Avatar>
      <AvatarImage src={avatarSrc} alt={name || "Contacto"} />
      <AvatarFallback>{name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
    </Avatar>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <span className="font-medium">{name || "Sin nombre"}</span>
        <span className="text-muted-foreground text-xs">{timestamp}</span>
      </div>
      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <p className="truncate">{lastMessage || "…"}</p>
        {hasUnread && <div className="ml-2 h-2 w-2 rounded-full bg-blue-500" />}
      </div>
    </div>
  </div>
);

/* ---------- Helpers ---------- */
function formatTimeFromEpoch(epoch?: number): string {
  if (!epoch) return "";
  const ms = epoch < 2_000_000_000 ? epoch * 1000 : epoch; // soporta seg/ms
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

/* ---------- Componente ---------- */
export function ChatSidebar({ result }: { result: FetchChatsResult }) {
  const [activeTab, setActiveTab] = useState<"personal" | "groups">("personal");
  const [activeChatId, setActiveChatId] = useState<string>("");

  const contacts = useMemo(() => {
    if (!result.success) return [];
    return result.data.map((c) => ({
      id: c.remoteJid,
      name: nameFrom(c),
      avatarSrc: avatarFrom(c),
      lastMessage: lastTextFrom(c),
      timestamp: formatTimeFromEpoch(c.lastMessage?.messageTimestamp),
      hasUnread: (c.unreadCount ?? 0) > 0,
      isGroup: c.remoteJid?.includes("@g.us"),
    }));
  }, [result]);

  useEffect(() => {
    if (!activeChatId && contacts.length > 0) setActiveChatId(contacts[0].id);
  }, [contacts, activeChatId]);

  const filteredContacts =
    activeTab === "groups"
      ? contacts.filter((c) => c.isGroup)
      : contacts.filter((c) => !c.isGroup);

  return (
    <div className="flex w-80 flex-col border border-r p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chat</h1>
        <Search className="text-muted-foreground h-5 w-5 cursor-pointer" />
      </div>

      <div className="mb-2">
        {!result.success ? (
          <p className="text-destructive text-sm">{result.message}</p>
        ) : (
          <p className="text-muted-foreground text-xs">{contacts.length} chats</p>
        )}
      </div>

      <div className="mb-6 flex rounded-lg border p-1">
        <Button
          variant="ghost"
          className={cn(
            "h-9 flex-1 rounded-md text-sm font-medium",
            activeTab === "personal" ? "shadow-sm" : "text-muted-foreground hover:bg-transparent"
          )}
          onClick={() => setActiveTab("personal")}
        >
          <User className="mr-2 h-4 w-4" />
          Personal
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "h-9 flex-1 rounded-md text-sm font-medium",
            activeTab === "groups" ? "shadow-sm" : "text-muted-foreground hover:bg-transparent"
          )}
          onClick={() => setActiveTab("groups")}
        >
          <Users className="mr-2 h-4 w-4" />
          Groups
        </Button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
        {result.success && filteredContacts.length > 0 ? (
          filteredContacts.map((c) => (
            <ChatContact
              key={c.id}
              id={c.id}
              name={c.name}
              avatarSrc={c.avatarSrc}
              lastMessage={c.lastMessage}
              timestamp={c.timestamp}
              hasUnread={c.hasUnread}
              isActive={c.id === activeChatId}
              onClick={setActiveChatId}
            />
          ))
        ) : (
          <p className="text-muted-foreground text-sm">
            {result.success ? "Sin chats para mostrar." : "No disponible."}
          </p>
        )}
      </div>

      <div className="mt-6">
        <Button className="w-full">New chat</Button>
      </div>
    </div>
  );
}

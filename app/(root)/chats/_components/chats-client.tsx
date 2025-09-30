"use client";

import { useEffect, useMemo, useState } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMain, type EvolutionMessage } from "./chat-main";

/* ---------- Tipos para la lista de chats ---------- */
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

/* ---------- Helpers JID ---------- */
function normalizeJid(jid?: string | null): string {
  return (jid || "").trim().toLowerCase();
}
function isMsgForJid(m: EvolutionMessage, jid: string): boolean {
  const target = normalizeJid(jid);
  const a = normalizeJid(m?.key?.remoteJid);
  const b = normalizeJid(m?.remoteJid);
  return a === target || b === target;
}

interface ChatsClientProps {
  chatsResult: FetchChatsResult;
  initialSelectedJid: string;
  initialMessages: EvolutionMessage[];
  instanceName?: string;
  /**
   * Server Action (POST):
   * (remoteJid: string, opts?: { page?: number; pageSize?: number }) =>
   *   Promise<{ success:boolean; data?: EvolutionMessage[]; total?:number; pages?:number;
   *             currentPage?:number; nextPage?:number|null; message?:string; queriedRemoteJid?: string }>
   */
  warmMessages?: (
    remoteJid: string,
    opts?: { page?: number; pageSize?: number }
  ) => Promise<{
    success: boolean;
    data?: EvolutionMessage[];
    message?: string;
    total?: number;
    pages?: number;
    currentPage?: number;
    nextPage?: number | null;
    queriedRemoteJid?: string;
  }>;
}

export function ChatsClient({
  chatsResult,
  initialSelectedJid,
  initialMessages,
  warmMessages,
  instanceName,
}: ChatsClientProps) {
  const [selectedJid, setSelectedJid] = useState(initialSelectedJid || "");
  const [messages, setMessages] = useState<EvolutionMessage[]>(() => {
    // 🔒 Asegura que los iniciales correspondan al JID inicial
    const jid = normalizeJid(initialSelectedJid);
    return jid ? (initialMessages || []).filter((m) => isMsgForJid(m, jid)) : (initialMessages || []);
  });
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

  const contacts = useMemo<ChatData[]>(() => {
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

  // Autoselección inicial si faltara selectedJid
  useEffect(() => {
    if (!selectedJid && contacts.length > 0) {
      const first = contacts[0].remoteJid;
      setSelectedJid(first);
      setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid: first }));
      setMessages([]); // evita “fantasma” si cambias rápido luego
    }
  }, [contacts, selectedJid, instanceName]);

  // Handler: log + cambio de estado + limpiar + POST + set mensajes (filtrados por JID)
  const handleSelectFromSidebar = async (remoteJid: string) => {
    console.log("[ChatSidebar] seleccionado:", remoteJid);

    setSelectedJid(remoteJid);
    setInfo((i) => ({ ...(i ?? {}), instanceName, remoteJid }));
    setLoading(true);

    // Limpia para no ver mensajes del chat anterior mientras carga
    setMessages([]);

    const page = 1;
    const pageSize = 50;

    // Log descriptivo (sin exponer URL/API key)
    console.log("[ChatsClient] ServerAction POST (descripción):", {
      method: "POST",
      url: "<oculto>",
      headers: { "Content-Type": "application/json", apikey: "***redacted***" },
      body: { instanceName, remoteJid, page, pageSize },
    });

    if (!warmMessages) {
      setLoading(false);
      return;
    }

    try {
      const res = await warmMessages(remoteJid, { page, pageSize });

      // Logs de respuesta (valida remoteJid de origen)
      const sample = (res?.data ?? []).slice(0, 5).map((m) => ({
        id: m.id ?? m.key?.id,
        fromMe: m.key?.fromMe,
        remoteJid: m.key?.remoteJid ?? m.remoteJid,
        type: m.messageType,
        ts: m.messageTimestamp,
        text:
          typeof (m.message as any)?.conversation === "string"
            ? (m.message as any).conversation
            : (m as any)?.message?.extendedTextMessage?.text || "",
      }));
      console.log(
        "[ChatsClient] RESP success:",
        res?.success,
        "queriedRemoteJid:",
        res?.queriedRemoteJid,
        "len:",
        res?.data?.length ?? 0,
        "sample:",
        sample
      );

      if (res?.success) {
        // 🧽 FILTRO DURO: solo mensajes del remoteJid seleccionado
        const filtered = (res.data || []).filter((m) => isMsgForJid(m, remoteJid));
        if (filtered.length !== (res.data || []).length) {
          console.warn(
            "[ChatsClient] Se filtraron",
            (res.data || []).length - filtered.length,
            "mensajes que no pertenecían a",
            remoteJid
          );
        }

        setMessages([...(filtered || [])]); // fuerza nueva referencia
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
  };

  return (
    <div className="flex h-full">
      <ChatSidebar
        result={chatsResult}
        onSelectRemoteJid={handleSelectFromSidebar}
        selectedJid={selectedJid}
      />
      <ChatMain
        key={selectedJid || "no-jid"} // remount por contacto
        header={header}
        messages={messages}
        info={info}
        loading={loading}
      />
    </div>
  );
}

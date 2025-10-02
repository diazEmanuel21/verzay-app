"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowRight, ImageIcon, MoreVertical, Paperclip, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type EvolutionMessage = {
  id?: string;
  key?: { id?: string; fromMe?: boolean; remoteJid?: string };
  messageType?: string;
  messageTimestamp?: number;
  pushName?: string | null;
  participant?: string | null;
  status?: string;
  message?: Record<string, unknown>;
  contextInfo?: Record<string, unknown> | null;
  remoteJid?: string;
};

type ChatHeader = { name: string; avatarSrc?: string; status?: string };
type ChatInfoMeta = {
  total?: number; pages?: number; currentPage?: number; nextPage?: number | null;
  instanceName?: string; remoteJid?: string;
};
// 💡 MODIFICACIÓN: Se añade el prop handleSend
type ChatMainProps = {
  header: ChatHeader;
  messages: EvolutionMessage[];
  info?: ChatInfoMeta;
  loading?: boolean;
  /** Función que se ejecuta al enviar un mensaje. Recibe el texto del input. */
  handleSend: (message: string) => void;
};

interface MessageBubbleProps { message: string; isUserMessage: boolean; avatarSrc?: string; timestamp?: number; }

/* ---------- Utils ---------- */
const DAY_MS = 24 * 60 * 60 * 1000;

function evolutionToText(m: EvolutionMessage): string {
  const msg = (m.message ?? {}) as any;
  if (typeof msg.conversation === "string" && msg.conversation.trim()) return msg.conversation.trim();
  if (msg.extendedTextMessage?.text) return String(msg.extendedTextMessage.text);
  if (msg.imageMessage) return "[Imagen]";
  if (msg.videoMessage) return "[Video]";
  if (msg.audioMessage) return "[Audio]";
  if (msg.documentMessage) return "[Documento]";
  if (msg.stickerMessage) return "[Sticker]";
  if (msg.locationMessage) return "[Ubicación]";
  if (msg.contactMessage) return "[Contacto]";
  if (msg.pollCreationMessage) return "[Encuesta]";
  return "[Mensaje no compatible]";
}
function getEpoch(m: EvolutionMessage): number {
  let t = Number(m.messageTimestamp ?? (m as any).timestamp ?? (m as any).msgTimestamp ?? 0) || 0;
  if (t > 2_000_000_000) t = Math.floor(t / 1000);
  return t;
}
function relativeTime(ts?: number) {
  if (!ts) return "";
  const d = new Date((ts < 2_000_000_000 ? ts * 1000 : ts));
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "ahora";
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)} min`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / 3_600_000)} h`;
  return d.toLocaleDateString();
}

type UIBubble = { id: string; sender: "user" | "other"; content: string; avatarSrc?: string; ts?: number };
function adaptEvolutionMessages(items: EvolutionMessage[], otherAvatar?: string): UIBubble[] {
  const sorted = [...(items || [])].sort((a, b) => getEpoch(a) - getEpoch(b));
  return sorted.map((m, idx) => {
    const isUser = Boolean(m.key?.fromMe);
    const idPart = m.id || m.key?.id || "no-id";
    const jidPart = m.key?.remoteJid || m.remoteJid || "no-jid";
    const tsPart = String(getEpoch(m));
    const uniqueId = `${jidPart}::${idPart}::${tsPart}::${idx}`;
    return { id: uniqueId, sender: isUser ? "user" : "other", content: evolutionToText(m), avatarSrc: !isUser ? otherAvatar : undefined, ts: getEpoch(m) };
  });
}

function isDifferentDay(a?: number, b?: number) {
  if (!a || !b) return true;
  const da = new Date(a < 2_000_000_000 ? a * 1000 : a);
  const db = new Date(b < 2_000_000_000 ? b * 1000 : b);
  return (
    da.getFullYear() !== db.getFullYear() ||
    da.getMonth() !== db.getMonth() ||
    da.getDate() !== db.getDate()
  );
}

const MessageBubble = ({ message, isUserMessage, avatarSrc, timestamp }: MessageBubbleProps) => (
  <div className={cn("flex items-end gap-2", isUserMessage ? "justify-end" : "justify-start")}>
    {!isUserMessage && (
      <Avatar className="h-7 w-7 translate-y-1 shadow-sm ring-1 ring-border">
        <AvatarImage src={avatarSrc || "/placeholder.svg"} alt="User Avatar" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    )}
    <div
      className={cn(
        "relative max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm",
        isUserMessage
          ? "bg-primary text-primary-foreground rounded-br-sm"
          : "bg-muted rounded-bl-sm"
      )}
    >
      <p className="whitespace-pre-wrap break-words leading-relaxed">{message}</p>
      {timestamp ? (
        <span
          className={cn(
            "text-[10px] opacity-80",
            isUserMessage ? "text-primary-foreground/80" : "text-muted-foreground"
          )}
        >
          {relativeTime(timestamp)}
        </span>
      ) : null}
    </div>
  </div>
);

function DaySeparator({ ts }: { ts: number }) {
  const d = new Date(ts < 2_000_000_000 ? ts * 1000 : ts);
  const label = d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
  return (
    <div className="sticky top-2 z-0 my-2 flex items-center justify-center">
      <span className="bg-background text-muted-foreground ring-border/70 inline-flex rounded-full px-3 py-1 text-xs ring">
        {label}
      </span>
    </div>
  );
}

/* ---------- Componente ---------- */
export function ChatMain({ header, messages, info, loading, handleSend }: ChatMainProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  // 💡 NUEVO ESTADO: Para manejar el texto del input
  const [messageText, setMessageText] = useState("");

  const uiMessages = useMemo(() => adaptEvolutionMessages(messages, header.avatarSrc), [messages, header.avatarSrc]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight + 9999;
  }, []);

  // 💡 NUEVA FUNCIÓN: Para manejar el envío del mensaje
  const handleSendMessage = useCallback(() => {
    const text = messageText.trim();
    if (text.length > 0) {
      handleSend(text); // Ejecuta el prop handleSend con el mensaje
      setMessageText(""); // Limpia el input
    }
  }, [messageText, handleSend]);


  // Auto-scroll al final cuando llegan mensajes
  useEffect(() => {
    scrollToBottom();
  }, [uiMessages, scrollToBottom]);

  // Mostrar botón "ir abajo" si te alejas del final
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      setShowScrollBtn(!nearBottom);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // LOGS
  useEffect(() => {
    const sample = messages.slice(0, 5).map((m) => ({
      id: m.id ?? m.key?.id,
      fromMe: m.key?.fromMe,
      remoteJid: m.key?.remoteJid ?? m.remoteJid,
      messageType: m.messageType,
      messageTimestamp: m.messageTimestamp,
      keys: Object.keys(m.message || {}),
    }));
    // console.log("[ChatMain] info:", info, "len:", messages.length, "sample:", sample);
  }, [messages, info]);

  // Composición con separadores
  const composed = useMemo(() => {
    const out: Array<{ type: "separator" | "msg"; ts: number; data?: UIBubble }> = [];
    let prevTs = 0;
    for (const m of uiMessages) {
      const ts = m.ts || 0;
      if (isDifferentDay(ts, prevTs)) {
        out.push({ type: "separator", ts });
      }
      out.push({ type: "msg", ts, data: m });
      prevTs = ts;
    }
    return out;
  }, [uiMessages]);

  return (
    <section className="relative m-4 flex flex-1 flex-col overflow-hidden rounded-2xl border bg-background shadow-sm">
      {/* Header sticky */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/80 p-4 backdrop-blur">
        <Avatar className="h-10 w-10 ring-2 ring-background">
          <AvatarImage src={header.avatarSrc || "/placeholder.svg"} alt={header.name} />
          <AvatarFallback>{header.name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold leading-tight">{header.name}</h2>
          {header.status && <p className="text-muted-foreground truncate text-xs">{header.status}</p>}
        </div>
        <button className="rounded-full p-2 hover:bg-muted" aria-label="Más opciones">
          <MoreVertical className="text-muted-foreground h-5 w-5" />
        </button>
      </div>

      {/* Lista de mensajes */}
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {/* Skeleton / Loader */}
        {loading && messages.length === 0 && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn("flex items-end gap-2", i % 2 ? "justify-end" : "justify-start")}>
                <div className={cn("rounded-2xl bg-muted/70 px-3 py-4 shadow-sm", i % 2 ? "rounded-br-sm" : "rounded-bl-sm")}>
                  <div className="h-3 w-52 animate-pulse rounded bg-foreground/10" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && composed.length === 0 && (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 pt-10 text-center">
            <div className="rounded-2xl border p-6 opacity-70">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <p className="text-sm">Selecciona un chat para ver los mensajes.</p>
          </div>
        )}

        {!loading &&
          composed.map((item, idx) =>
            item.type === "separator" ? (
              <DaySeparator key={`sep-${item.ts}-${idx}`} ts={item.ts} />
            ) : (
              <MessageBubble
                key={item.data!.id}
                message={item.data!.content}
                isUserMessage={item.data!.sender === "user"}
                avatarSrc={item.data!.avatarSrc}
                timestamp={item.data!.ts}
              />
            )
          )}

        {/* Pie con metadatos de paginación */}
        {!loading && info && (info.pages || info.currentPage) && (
          <div className="text-muted-foreground/80 text-center text-[11px]">
            Página {info.currentPage ?? "?"}{info.pages ? ` / ${info.pages}` : ""}{typeof info.total === "number" ? ` · Total: ${info.total}` : ""}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2 border-t bg-background/60 p-3 backdrop-blur">
        <button className="rounded-full p-2 hover:bg-muted" aria-label="Adjuntar archivo">
          <Paperclip className="text-muted-foreground h-5 w-5" />
        </button>
        <button className="rounded-full p-2 hover:bg-muted" aria-label="Adjuntar imagen">
          <ImageIcon className="text-muted-foreground h-5 w-5" />
        </button>
        <Input
          // 💡 IMPLEMENTACIÓN: Enlace al estado y manejo de cambios
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault(); // Evita el salto de línea por defecto
              handleSendMessage();
            }
          }}
          placeholder="Escribe un mensaje…"
          className="flex-1 border-none bg-muted/50 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          // 💡 IMPLEMENTACIÓN: Enlace a la función de envío
          onClick={handleSendMessage}
          disabled={messageText.trim().length === 0}
          size="icon"
          className="rounded-full"
          aria-label="Enviar"
        >
          <ArrowRight />
        </Button>
      </div>

      {/* Botón ir al final */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="bg-background/80 ring-border hover:bg-background fixed bottom-24 right-8 z-30 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs shadow ring"
          aria-label="Ir al final"
        >
          <ChevronDown className="h-4 w-4" />
          Abajo
        </button>
      )}
    </section>
  );
}
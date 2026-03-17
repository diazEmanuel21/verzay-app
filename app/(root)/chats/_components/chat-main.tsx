'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Mic, Send, Trash2, X, Clock, Check } from 'lucide-react';
import { cn, SERVER_TIME_ZONE } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AttachmentMenu, type ComposeMedia, type MediaType } from './attachment-menu';
import { SwitchStatus } from '../../sessions/_components';
import { SafeImage } from '@/components/custom/SafeImage';
import { toast } from 'sonner';

/*  Importaciones de Acciones y Tipos de Servidor */
import { getMediaBase64FromMessage, type EvolutionMessage } from '@/actions/chat-actions';
import { getSessionByRemoteJid } from '@/actions/session-action';
import { SessionTagsCombobox } from '../../tags/components';
import { Session, SimpleTag, SingleSessionResponse } from '@/types/session';
import { CrmFollowUpSummaryBadge } from '../../crm/dashboard/components/CrmFollowUpSummaryBadge';
import { LeadStatusBadge } from '../../crm/dashboard/components/records-table/LeadStatusBadge';
import { getDisplayWhatsappFromSession } from '../../crm/dashboard/helpers';

type ChatMainProps = {
  userId: string;
  header: ChatHeader;
  messages: EvolutionMessage[];
  info?: ChatInfoMeta;
  loading?: boolean;
  onSend: (payload: OutgoingMessagePayload) => void | Promise<void>;
  onBackToList: () => void;
  allTags: SimpleTag[];
};

/* -------- Outgoing payload unificado -------- */
// ... (El resto de tipos se mantienen igual) ...
export type OutgoingTextPayload = {
  kind: 'text';
  text: string;
  delay?: number;
  linkPreview?: boolean;
  mentionsEveryOne?: boolean;
  mentioned?: string[];
  quotedMessage?: { key: { id: string }; message: { conversation: string } };
};
export type OutgoingMediaPayload = {
  kind: 'media';
  mediatype: MediaType;
  mediaUrl: string; // Base64 PURO (audio) o Data URL (adjuntos)
  mimetype?: string;
  fileName?: string;
  caption?: string;
  ptt?: boolean;
  delay?: number;
  linkPreview?: boolean;
  mentionsEveryOne?: boolean;
  mentioned?: string[];
  quotedMessage?: { key: { id: string }; message: { conversation: string } };
};
export type OutgoingMessagePayload = OutgoingTextPayload | OutgoingMediaPayload;

/* -------- Evolution / UI Tipos Básicos -------- */
type ChatHeader = { name: string; avatarSrc?: string; status?: string };
type ChatInfoMeta = {
  total?: number;
  pages?: number;
  currentPage?: number;
  nextPage?: number | null;
  instanceName?: string;
  remoteJid?: string;
  remoteJidAliases?: string[];

  /** ⬇️ OPCIONAL: si el padre lo pasa, podemos resolver el base64 sin tocar más código */
  apiKeyData?: { url: string; key: string };
};
export type MediaData = { type: MediaType; url: string; mimeType: string; caption?: string };
type UIBubble = {
  id: string;
  sender: 'user' | 'other';
  content: string;
  avatarSrc?: string;
  ts?: number;
  media?: MediaData;
  status?: 'sending';
};

// Estado de previsualización de audio
type RecordedAudioData = {
  base64Pure: string; // Base64 PURO
  dataUrlWithPrefix: string; // Data URL para reproductor
  mimetype: string;
  durationSecs: number;
};

const CHAT_TIME_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: SERVER_TIME_ZONE,
});
const CHAT_DAY_KEY_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: SERVER_TIME_ZONE,
});
const CHAT_DATE_BADGE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: SERVER_TIME_ZONE,
});

/* -------- Helpers -------- */
function two(n: number) {
  return n.toString().padStart(2, '0');
}
function getCalendarDayKey(timestamp?: number) {
  if (!timestamp) return '';

  const parts = CHAT_DAY_KEY_FORMATTER.formatToParts(new Date(timestamp));
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) return '';
  return `${year}-${month}-${day}`;
}
function formatConversationDateLabel(timestamp?: number) {
  if (!timestamp) return '';

  const formatted = CHAT_DATE_BADGE_FORMATTER.format(new Date(timestamp));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
function base64FromBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error leyendo blob'));
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const commaIndex = dataUrl.indexOf(',');
      if (commaIndex === -1) return reject(new Error('Formato de Data URL inválido.'));
      resolve(dataUrl.substring(commaIndex + 1)); // Base64 PURO
    };
    reader.readAsDataURL(blob);
  });
}
function initialFromName(name?: string) {
  const c = (name || '').trim().charAt(0);
  return c ? c.toUpperCase() : 'U';
}
function extractMediaInfo(msg: any, type: MediaType): MediaData | null {
  const typeKey = `${type}Message`;
  const mediaObj = msg?.[typeKey] || {};
  const url = msg?.mediaUrl || mediaObj.mediaUrl || mediaObj.url || mediaObj.directPath;
  const mimeType = mediaObj.mimetype || 'application/octet-stream';
  const caption = mediaObj.caption;
  if (url) return { type, url, mimeType, caption: caption || undefined };
  return null;
}

/** Convierte EvolutionMessage -> UIBubble (inyectando media desde caché si existe) */
function toUIMessages(
  messages: EvolutionMessage[],
  avatarUrl: string | undefined,
  base64Map: Map<string, { dataUrl: string; mime: string; length: number }>
): UIBubble[] {
  return messages.map((m) => {
    //  Clasificación correcta: "user" solo si fromMe === true
    const isUser = m.key?.fromMe === true;
    const sender: 'user' | 'other' = isUser ? 'user' : 'other';
    const ts = m.messageTimestamp;
    let content = '';
    let media: MediaData | null = null;
    const messageData = (m.message || {}) as any;

    switch (m.messageType) {
      case 'conversation':
        content = messageData?.conversation || '';
        break;
      case 'extendedTextMessage':
        content = messageData?.extendedTextMessage?.text || '';
        break;
      case 'imageMessage':
        media = extractMediaInfo(messageData, 'image');
        content = media?.caption || '';
        break;
      case 'videoMessage':
        media = extractMediaInfo(messageData, 'video');
        content = media?.caption || '';
        break;
      case 'audioMessage':
        media = extractMediaInfo(messageData, 'audio');
        content = '';
        break;
      case 'documentMessage':
        media = extractMediaInfo(messageData, 'document');
        content = media?.caption || '';
        break;
      default:
        content = `[Mensaje ${m.messageType || 'desconocido'}]`;
    }

    // ⬇️ Inyección de base64 si está en caché
    const msgId = m.key?.id || m.id;
    if (msgId && base64Map.has(msgId) && media) {
      const cached = base64Map.get(msgId)!;
      media = { ...media, url: cached.dataUrl, mimeType: cached.mime };
    }

    return {
      id: m.id || (ts ? String(ts) : '') + (m.key?.id || Math.random().toString(36).slice(2)),
      sender,
      content,
      avatarSrc: sender === 'user' ? '/default.png' : avatarUrl,
      ts: ts ? ts * 1000 : undefined,
      media: media || undefined,
    };
  });
}

/* -------- Subcomponentes (mantengo tu código original) -------- */
const ExpandableText: React.FC<{ message: string; isUserMessage: boolean }> = ({
  message,
  isUserMessage,
}) => {
  const MAX_LENGTH = 250;
  const [isExpanded, setIsExpanded] = useState(false);
  if (!message) return null;
  if (message.length <= MAX_LENGTH) return <p className="text-sm whitespace-pre-wrap">{message}</p>;
  const displayedText = isExpanded ? message : `${message.substring(0, MAX_LENGTH)}...`;
  const linkClass = isUserMessage
    ? 'text-gray-300 hover:text-white'
    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300';
  return (
    <p className="text-sm whitespace-pre-wrap">
      {displayedText}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className={cn('ml-1 font-semibold text-xs inline-block', linkClass)}
        type="button"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Ver menos' : 'Ver más'}
      >
        {isExpanded ? 'Ver menos' : 'Ver más...'}
      </button>
    </p>
  );
};

const SendingMessageSkeleton: React.FC<{ tempMessage: UIBubble }> = ({ tempMessage }) => {
  const isMedia = tempMessage.media !== undefined;
  const bubbleClass =
    'bg-gray-300/50 dark:bg-gray-700/50 text-gray-500 rounded-xl rounded-br-sm self-end animate-pulse';
  return (
    <div className="flex items-end gap-1 my-1 justify-end opacity-70" aria-live="polite">
      <div className={cn('p-2 break-words relative inline-block max-w-[90%] sm:max-w-[70%]', bubbleClass)}>
        {isMedia ? (
          <div className="w-24 h-24 rounded-md bg-gray-400/50 dark:bg-gray-600/50 my-1" />
        ) : (
          <>
            <div className="h-3 w-48 bg-gray-400/50 dark:bg-gray-600/50 rounded mb-1" />
            <div className="h-3 w-32 bg-gray-400/50 dark:bg-gray-600/50 rounded" />
          </>
        )}
        <div className="text-[0.6rem] mt-1 flex justify-end items-center gap-1 text-gray-500/70">
          <Clock className="w-3 h-3" />
          <span>Enviando...</span>
        </div>
      </div>
    </div>
  );
};

const MediaRenderer: React.FC<{ media: MediaData | undefined }> = React.memo(({ media }) => {
  if (!media) return null;
  const { type, url, mimeType, caption } = media;
  const baseStyle = 'my-1 rounded-md overflow-hidden border dark:border-gray-600';
  const audioDocStyle = 'w-full max-w-[350px]';
  return (
    <div
      className={cn(
        baseStyle,
        'max-w-full',
        type === 'audio' || type === 'document' ? audioDocStyle : 'md:max-w-[300px]'
      )}
    >
      {type === 'image' && (
        <SafeImage
          src={url}
          alt={caption || 'Imagen'}
          className="w-full h-auto object-cover max-h-[300px] cursor-pointer"
          onClick={() => window.open(url, '_blank')}
          loading="lazy"
          decoding="async"
        />
      )}
      {type === 'video' && (
        <video
          src={url}
          controls
          className="w-full h-auto max-h-[300px] bg-black"
          poster={caption}
          preload="metadata"
        />
      )}
      {type === 'audio' && (
        <div className="p-2 bg-white dark:bg-gray-700 flex items-center border-t dark:border-gray-600">
          <Mic className="w-5 h-5 text-gray-500 dark:text-gray-300 mr-2 flex-shrink-0" />
          <audio src={url} controls className="flex-1 h-8" preload="metadata" />
        </div>
      )}
      {type === 'document' && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-blue-500 text-white flex items-center justify-between hover:bg-blue-600 transition"
          aria-label="Abrir documento"
        >
          <span className="truncate">{caption || mimeType}</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      )}
      {caption && type !== 'audio' && (
        <div
          className={cn(
            'text-xs p-1',
            type === 'document' ? 'text-gray-600 dark:text-gray-300' : 'text-gray-800 dark:text-gray-100'
          )}
        >

        </div>
      )}
    </div>
  );
});
MediaRenderer.displayName = 'MediaRenderer';

const MessageBubble: React.FC<{
  message: string;
  isUserMessage: boolean;
  avatarSrc?: string;
  timestamp?: number;
  media?: MediaData;
  status?: 'sending';
}> = ({ message, isUserMessage, avatarSrc, timestamp, media, status }) => {
  const bubbleClass = isUserMessage
    ? 'bg-primary text-white rounded-xl rounded-br-sm self-end'
    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl rounded-tl-sm self-start';
  const contentClass = isUserMessage ? 'text-white' : 'text-gray-800 dark:text-gray-100';
  const showAvatar = !isUserMessage;

  return (
    <div className={cn('flex items-end gap-1 my-1 ', isUserMessage ? 'justify-end' : 'justify-start')}>
      {showAvatar && (
        <div className="mr-1">
          <Avatar className="w-7 h-7">
            <AvatarImage src={avatarSrc || '/default-avatar.png'} />
            <AvatarFallback>{initialFromName()}</AvatarFallback>
          </Avatar>
        </div>
      )}
      <div className={cn('p-2 break-words relative inline-block max-w-[90%] sm:max-w-[70%]', bubbleClass)}>
        {media && <MediaRenderer media={media} />}
        {message && (
          <div className={cn(contentClass, 'pr-10')}>
            <ExpandableText message={message} isUserMessage={isUserMessage} />
          </div>
        )}
        <div className={cn('right-2 bottom-1 flex items-center gap-1')}>
          {timestamp && (
            <span
              className={cn(
                'text-[0.6rem] mt-1 block',
                isUserMessage ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400/80'
              )}
              aria-label="Hora del mensaje"
            >
              {CHAT_TIME_FORMATTER.format(new Date(timestamp))}
            </span>
          )}
          {isUserMessage && (
            <span className="text-[0.6rem] mt-1 block" aria-label={status === 'sending' ? 'Enviando' : 'Enviado'}>
              {status === 'sending' ? <Clock className="w-3 h-3 text-gray-300" /> : <Check className="w-3 h-3 text-gray-300" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ConversationDateBadge: React.FC<{ label: string }> = ({ label }) => (
  <div className="sticky top-2 z-10 my-3 flex justify-center pointer-events-none">
    <div className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-[0.68rem] font-medium text-slate-600 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/85 dark:text-slate-200">
      {label}
    </div>
  </div>
);

const ChatMessageList: React.FC<{
  uiMessages: UIBubble[];
  loading?: boolean;
  listRef: React.RefObject<HTMLDivElement>;
  tempMessage: UIBubble | null;
}> = ({ uiMessages, loading, listRef, tempMessage }) => {
  const fullList = useMemo(() => {
    const list = [...uiMessages];
    if (tempMessage) list.push(tempMessage);
    return list;
  }, [uiMessages, tempMessage]);
  const renderedList = useMemo(() => {
    const items: Array<
      | { type: 'date'; id: string; label: string }
      | { type: 'message'; id: string; message: UIBubble }
    > = [];
    let previousDayKey = '';

    for (const msg of fullList) {
      const currentDayKey = getCalendarDayKey(msg.ts);
      if (currentDayKey && currentDayKey !== previousDayKey) {
        items.push({
          type: 'date',
          id: `date-${currentDayKey}`,
          label: formatConversationDateLabel(msg.ts),
        });
        previousDayKey = currentDayKey;
      }

      items.push({ type: 'message', id: msg.id, message: msg });
    }

    return items;
  }, [fullList]);

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col custom-scrollbar w-full" ref={listRef}>
      {loading && <div className="text-center text-gray-500 py-4">Cargando mensajes…</div>}
      {renderedList.map((item) =>
        item.type === 'date' ? (
          <ConversationDateBadge key={item.id} label={item.label} />
        ) : item.message.status === 'sending' ? (
          <SendingMessageSkeleton key={item.id} tempMessage={item.message} />
        ) : (
          <MessageBubble
            key={item.id}
            message={item.message.content}
            isUserMessage={item.message.sender === 'user'}
            avatarSrc={item.message.avatarSrc}
            timestamp={item.message.ts}
            media={item.message.media}
          />
        )
      )}

    </div>
  );
};

/* -------- Componente principal con lógica de SwitchStatus corregida -------- */
export const ChatMain: React.FC<ChatMainProps> = ({ header, messages, info, loading, onSend, onBackToList, userId, allTags }) => {
  const [input, setInput] = useState('');
  const [composeMedia, setComposeMedia] = useState<ComposeMedia | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [tempMessage, setTempMessage] = useState<UIBubble | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userJid = info?.remoteJid;



  // ESTADOS PARA EL SWITCH: Almacena la sesión
  const [session, setSession] = useState<Session | null>(null);

  // Grabación de audio (resto de tu código de grabación...)
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudioData | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  /*  Caché de base64 en ref (evita bucles de renders) + dedupe de solicitudes en vuelo */
  const mediaCacheRef = useRef<Map<string, { dataUrl: string; mime: string; length: number }>>(new Map());
  const [mediaCacheTick, setMediaCacheTick] = useState(0); // solo para re-render controlado cuando se actualiza la caché
  const inflightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    mediaCacheRef.current.clear();
    inflightRef.current.clear();
    setMediaCacheTick((tick) => tick + 1);
  }, [userJid]);

  const initialSelectedTagIds = session?.tags?.map((t) => t?.id).filter(Boolean) ?? [];
  const displayedWhatsapp =
    session
      ? getDisplayWhatsappFromSession(session)
      : userJid?.includes('@')
        ? userJid.split('@')[0]
        : userJid || '';
  const sessionStatusTone = session?.status
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-700';

  // Detectores memoizados
  const isMediaMsg = useCallback((m: EvolutionMessage) => {
    const body = (m.message || {}) as any;
    return !!(body.imageMessage || body.videoMessage || body.audioMessage || body.documentMessage);
  }, []);
  const hasRemoteOnly = useCallback((m: EvolutionMessage) => {
    const body = (m.message || {}) as any;
    const media = body.imageMessage || body.videoMessage || body.audioMessage || body.documentMessage || {};
    const url = body.mediaUrl || media.mediaUrl || media.url || media.directPath;
    return !!url && typeof url === 'string' && !/^data:[^;]+;base64,/.test(url);
  }, []);
  const getMessageId = useCallback((m: EvolutionMessage) => m.key?.id || m.id || null, []);

  /* 🔌 Resolver base64 usando TU action existente */
  useEffect(() => {
    const instanceName = info?.instanceName;
    const apiKeyData = info?.apiKeyData;
    if (!instanceName || !messages?.length || !apiKeyData) return;

    const candidates: string[] = [];
    for (const m of messages) {
      if (!isMediaMsg(m) || !hasRemoteOnly(m)) continue;
      const mid = getMessageId(m);
      if (!mid) continue;
      if (mediaCacheRef.current.has(mid) || inflightRef.current.has(mid)) continue;
      candidates.push(mid);
    }
    if (!candidates.length) return;

    let cancelled = false;

    (async () => {
      for (const messageId of candidates) {
        try {
          inflightRef.current.add(messageId);
          const res = await getMediaBase64FromMessage(apiKeyData, instanceName, messageId);
          if (!res || cancelled) continue;
          if (res.success && res.data?.base64) {
            const dataUrl = `data:${res.data.mimetype || 'application/octet-stream'};base64,${res.data.base64}`;
            mediaCacheRef.current.set(messageId, {
              dataUrl,
              mime: res.data.mimetype,
              length: res.data.fileLength,
            });
            setMediaCacheTick((t) => t + 1); // provoca re-render
          }
        } catch {
          // swallow; si falla uno seguimos con los demás
        } finally {
          inflightRef.current.delete(messageId);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [messages, info?.instanceName, info?.apiKeyData, isMediaMsg, hasRemoteOnly, getMessageId]);


  /* 🚀 Lógica para obtener el estado de la sesión (SwitchStatus) */
  const fetchSessionStatus = useCallback(async () => {
    // Utilizamos userId y info?.remoteJid directamente en el cuerpo del useCallback
    if (!userId || !info?.remoteJid) {
      setSession(null);
      return;
    }

    try {
      const remoteJidCandidates = Array.from(
        new Set([info.remoteJid, ...(info.remoteJidAliases ?? [])].filter(Boolean))
      );

      let resolvedSession: SingleSessionResponse | null = null;
      for (const candidate of remoteJidCandidates) {
        const result: SingleSessionResponse = await getSessionByRemoteJid(userId, candidate, {
          instanceId: info.instanceName,
          pushName: header.name,
          ensureExists: candidate === info.remoteJid,
          aliases: remoteJidCandidates,
        });

        if (result.success && result.data) {
          resolvedSession = result;
          break;
        }
      }

      if (resolvedSession?.success && resolvedSession.data) {
        setSession(resolvedSession.data);
      } else {
        setSession(null);
      }
    } catch (error) {
      setSession(null);
      console.error("Error al obtener el estado de la sesión:", error);
    }
  }, [header.name, info?.instanceName, info?.remoteJid, info?.remoteJidAliases, userId]);

  // Llama a la función de obtención de estado cuando cambie el JID o el usuario
  useEffect(() => {
    // Solo llama si el usuario ha sido cargado y no está nulo
    if (userId && info?.remoteJid) { // También verifica que remoteJid esté presente
      void fetchSessionStatus();
    }
  }, [fetchSessionStatus, userId, info?.remoteJid]);


  /* Construye UI con caché */
  const reversed = useMemo(() => messages.slice().reverse(), [messages]);
  const uiMessages = useMemo(() => {
    void mediaCacheTick;
    return toUIMessages(reversed, header.avatarSrc, mediaCacheRef.current);
  }, [reversed, header.avatarSrc, mediaCacheTick]);

  /* Scroll to bottom (useLayoutEffect minimiza “salto” visual) */
  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);
  useLayoutEffect(() => {
    scrollToBottom();
  }, [uiMessages.length, tempMessage, scrollToBottom]);

  /* Auto-resize del textarea */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  /* Handlers */
  const handleComposeMediaChange = useCallback((m: ComposeMedia | null) => {
    setComposeMedia(m);
    if (m) setInput('');
  }, []);
  const clearComposeMedia = useCallback(() => setComposeMedia(null), []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  const startTimer = useCallback(() => {
    stopTimer();
    setRecordSecs(0);
    timerRef.current = window.setInterval(() => setRecordSecs((s) => s + 1), 1000) as unknown as number;
  }, [stopTimer]);
  const formatSecs = useCallback(
    (s: number) => `${two(Math.floor(s / 60))}:${two(s % 60)}`,
    []
  );

  const stopMicrophoneStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  /* Envío */
  const sendNow = useCallback(async () => {

    let payload: OutgoingMessagePayload | null = null;
    let content = '';
    let media: MediaData | undefined = undefined;

    if (recordedAudio) {
      payload = {
        kind: 'media',
        mediatype: 'audio',
        mediaUrl: recordedAudio.base64Pure,
        mimetype: recordedAudio.mimetype,
        ptt: true,
      };
      content = '';
      media = { type: 'audio', url: recordedAudio.dataUrlWithPrefix, mimeType: recordedAudio.mimetype };
      setRecordedAudio(null);
    } else if (composeMedia) {
      const caption = input && input.trim() ? input.trim() : '';
      payload = {
        kind: 'media',
        mediatype: composeMedia.mediatype,
        mediaUrl: composeMedia.dataUrl,
        mimetype: composeMedia.mimeType,
        fileName: composeMedia.fileName,
        caption,
      };
      content = caption || '';
      media = {
        type: composeMedia.mediatype,
        url: composeMedia.dataUrl,
        mimeType: composeMedia.mimeType,
        caption,
      };
      setInput('');
      setComposeMedia(null);
    } else {
      const text = input.trim();
      if (!text) return;
      payload = { kind: 'text', text };
      content = text;
      setInput('');
    }

    if (payload) {
      const tempMsg: UIBubble = {
        id: `temp-${Date.now()}`,
        sender: 'user',
        content,
        avatarSrc: '/user-avatar.png',
        ts: Date.now(),
        media,
        status: 'sending',
      };
      setTempMessage(tempMsg);
      setIsSending(true);
      try {
        await onSend(payload);
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        toast.error(
          error instanceof Error ? error.message : 'No se pudo enviar el mensaje.',
        );
      } finally {
        setIsSending(false);
        setTempMessage(null);
      }
    }
  }, [recordedAudio, composeMedia, input, onSend]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!isRecording && !recordedAudio && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void sendNow();
      }
    },
    [sendNow, isRecording, recordedAudio]
  );

  /* Grabación de Audio */
  const stopRecordingAndPreview = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
  }, []);
  const cancelRecording = useCallback(() => {
    stopTimer();
    setIsRecording(false);
    audioChunksRef.current = [];
    setRecordedAudio(null);
    const rec = mediaRecorderRef.current;
    if (rec) {
      try {
        if (rec.state !== 'inactive') rec.stop();
      } catch { }
      mediaRecorderRef.current = null;
    }
    stopMicrophoneStream();
  }, [stopTimer, stopMicrophoneStream]);

  const startRecording = useCallback(async () => {
    if (isSending) return;
    // Reinicia cualquier grabación previa
    cancelRecording();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeCandidates = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg'];
      const chosenMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, chosenMime ? { mimeType: chosenMime } : undefined);

      audioChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      rec.onstart = () => {
        setIsRecording(true);
        startTimer();
      };
      rec.onstop = async () => {
        stopTimer();
        setIsRecording(false);
        mediaRecorderRef.current = null;

        const finalMimeType = rec.mimeType || chosenMime || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: finalMimeType });
        audioChunksRef.current = [];

        if (blob.size === 0) {
          stopMicrophoneStream();
          return;
        }
        try {
          const base64Pure = await base64FromBlob(blob);
          const dataUrlWithPrefix = `data:${finalMimeType};base64,${base64Pure}`;
          setRecordedAudio({
            base64Pure,
            dataUrlWithPrefix,
            mimetype: finalMimeType,
            durationSecs: (prev => prev)(recordSecs), // mantiene lo contado
          });
        } catch (err) {
          console.error('Error preparando audio base64:', err);
        } finally {
          stopMicrophoneStream();
        }
      };

      rec.start();
      mediaRecorderRef.current = rec;
    } catch (err) {
      console.error('Error al iniciar grabación:', err);
      cancelRecording();
    }
  }, [cancelRecording, startTimer, stopTimer, stopMicrophoneStream, isSending, recordSecs]);

  // Cleanup al desmontar
  useEffect(() => cancelRecording, [cancelRecording]);

  // Flags derivados
  const isPreviewingAudio = recordedAudio !== null && !isRecording;
  const isInputActive = !isRecording && !isPreviewingAudio && !isSending;
  const isSendButtonVisible = isInputActive && (input.trim().length > 0 || !!composeMedia);

  return (
    <div className="flex flex-col h-[95%] md:h-full w-full min-w-[100px] bg-white dark:bg-gray-800 border-l border-r">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b dark:border-gray-700 shadow-md bg-white dark:bg-gray-800 z-10">
        <div className="flex min-w-0 flex-1 items-center gap-3">

          {/* FIN BOTÓN DE REGRESO */}
          <Button
            onClick={onBackToList}
            size="icon"
            variant="ghost"
            className="md:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-700 mr-1"
            title="Volver a la lista de chats"
            aria-label="Volver a la lista de chats"
          >
            <ArrowRight className="w-5 h-5 rotate-180" /> {/* Usa la misma flecha, rotada 180 grados */}
          </Button>

          <Avatar className="w-10 h-10">
            <AvatarImage src={header.avatarSrc || '/default-avatar.png'} />
            <AvatarFallback>{initialFromName(header.name)}</AvatarFallback>
          </Avatar>


          {/* ◀️ BOTÓN DE REGRESO A LA LISTA (VISIBLE SOLO EN MÓVIL) */}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold dark:text-white sm:text-base">
                {header.name}
              </p>
              {session && (
                <SessionTagsCombobox
                  userId={session.userId}
                  sessionId={session.id}
                  allTags={allTags}
                  initialSelectedIds={initialSelectedTagIds}
                />
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {displayedWhatsapp && (
                <span className="font-medium text-foreground/80">
                  {displayedWhatsapp}
                </span>
              )}

              {session ? (
                <>
                  <Badge variant="outline" className={sessionStatusTone}>
                    {session.status ? 'Activa' : 'Pausada'}
                  </Badge>
                  <LeadStatusBadge status={session.leadStatus ?? null} />
                  <CrmFollowUpSummaryBadge
                    summary={session.crmFollowUpSummary}
                    userId={session.userId}
                    remoteJid={session.remoteJid}
                    instanceId={session.instanceId}
                    onUpdated={fetchSessionStatus}
                  />
                </>
              ) : (
                <span>Sin sesión CRM sincronizada</span>
              )}
            </div>
          </div>

          {session && (
            <div className="sm:hidden">
              <SwitchStatus
                key={`${session.id}-${session.status ? 'on' : 'off'}`}
                checked={session.status ?? false}
                sessionId={session.id ?? -1}
                mutateSessions={fetchSessionStatus}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mensajes */}
      <ChatMessageList
        uiMessages={uiMessages}
        loading={loading} // Incluye la carga del usuario
        listRef={listRef}
        tempMessage={tempMessage}
      />

      {/* Barra de mensaje */}
      <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {/* Previsualización de adjuntos */}
        {composeMedia && (
          <div className="mb-2 flex items-center gap-2">
            {composeMedia.mediatype === 'image' ? (
              <div className="relative w-16 h-16 rounded-md overflow-hidden border bg-white dark:bg-gray-800">
                <SafeImage
                  src={composeMedia.dataUrl}
                  alt={composeMedia.fileName}
                  fill
                  sizes="64px"
                  className="w-full h-full object-cover"
                />
                <button
                  className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full p-1 z-10"
                  onClick={clearComposeMedia}
                  aria-label="Quitar adjunto"
                  type="button"
                  title="Quitar adjunto"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="relative w-16 h-16 rounded-md overflow-hidden border bg-white dark:bg-gray-800 flex items-center justify-center text-xs px-1 text-center">
                <span className="truncate">{composeMedia.fileName}</span>
                <button
                  className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full p-1"
                  onClick={clearComposeMedia}
                  aria-label="Quitar adjunto"
                  type="button"
                  title="Quitar adjunto"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="text-xs text-gray-600 dark:text-gray-300">
              <div className="font-medium truncate max-w-[180px]">{composeMedia.fileName}</div>
              <div className="opacity-80">{composeMedia.mimeType}</div>
              <div className="opacity-80 capitalize">{composeMedia.mediatype}</div>
            </div>
          </div>
        )}

        {/* Indicador de Grabación */}
        {isRecording && (
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2 rounded-full px-3 py-1 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-medium">Grabando…</span>
                <span className="tabular-nums">{formatSecs(recordSecs)}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700"
              onClick={cancelRecording}
              title="Cancelar grabación"
              aria-label="Cancelar grabación"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Previsualización de Audio Grabado */}
        {isPreviewingAudio && recordedAudio && (
          <div className="flex items-center gap-2 p-2 mb-2 rounded-lg bg-gray-100 dark:bg-gray-700 border dark:border-gray-600">
            <Button
              onClick={cancelRecording}
              size="icon"
              className="rounded-full bg-red-500 hover:bg-red-600 flex-shrink-0"
              title="Borrar nota de voz"
              aria-label="Borrar nota de voz"
              type="button"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            <audio src={recordedAudio.dataUrlWithPrefix} controls className="flex-1 h-8" />
            <span className="text-sm tabular-nums text-gray-600 dark:text-gray-300 flex-shrink-0">
              {formatSecs(recordedAudio.durationSecs)}
            </span>
            <Button
              onClick={() => void sendNow()}
              size="icon"
              className="rounded-full bg-green-500 hover:bg-green-600 flex-shrink-0"
              title="Enviar nota de voz"
              aria-label="Enviar nota de voz"
              type="button"
            >
              <Send className="w-5 h-5 text-white" />
            </Button>
          </div>
        )}

        {/* Input + botones */}
        <div className="relative flex flex-nowrap  ">
          <div className="relative  flex flex-nowrap z-10 items-center justify-center ">
            <div className='hidden sm:block'>

              {(
                session &&
                <SwitchStatus
                  key={`${session?.id}-${session?.status ? 'on' : 'off'}`}
                  checked={session?.status ?? false} // Usamos el status de la sesión
                  sessionId={session?.id ?? -1} // Usamos el JID del chat como ID de sesión
                  mutateSessions={fetchSessionStatus} // Función para refrescar el estado de la sesión
                />
              )}
            </div>

            {(
              <AttachmentMenu
                onComposeMediaChange={handleComposeMediaChange}
                maxBase64MB={8}
              />
            )}
          </div>

          <Textarea
            ref={textareaRef}
            placeholder={composeMedia ? 'Añade un texto o pie de foto (opcional)...' : 'Escribe un mensaje...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={!isInputActive}
            rows={1}
            aria-label="Escribe tu mensaje"
            className={cn(
              'min-h-[44px] max-h-40 h-auto bg-white dark:bg-gray-800 dark:text-white rounded-lg border-none w-full',
              'pl-4 pr-24 resize-none overflow-y-auto text-sm md:text-base',
            )}
          />

          <div className="absolute right-1 flex items-center gap-1 bottom-1">
            {!isPreviewingAudio && (
              <Button
                onClick={() => (isRecording ? stopRecordingAndPreview() : startRecording())}
                size="icon"
                className={cn(
                  'rounded-full',
                  isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600'
                )}
                aria-label={isRecording ? 'Detener grabación y previsualizar' : 'Grabar nota de voz'}
                title={isRecording ? 'Detener y previsualizar' : 'Grabar nota de voz'}
                type="button"
              >
                <Mic className={cn('w-5 h-5', isRecording ? 'text-white' : 'text-black dark:text-white')} />
              </Button>
            )}
            {(
              <Button
                onClick={() => void sendNow()}
                size="icon"
                className="rounded-full bg-blue-500 hover:bg-blue-600"
                aria-label="Enviar"
                title="Enviar"
                disabled={!isPreviewingAudio && !isSendButtonVisible}
                type="button"
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

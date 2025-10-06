'use server';

import type { ApiKey } from '@prisma/client';

/* ==================================
 0. Utilidades de Logging (no invasivas)
 ================================== */

function maskKey(k?: string) {
  if (!k) return '';
  if (k.length <= 8) return '****';
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}
function isDataUrl(v?: string) {
  return !!v && /^data:[^;]+;base64,/i.test(v);
}
function shrinkDataUrl(v?: string) {
  if (!v) return v;
  if (!isDataUrl(v)) return v;
  const comma = v.indexOf(',');
  const header = v.slice(0, comma + 1);
  const len = v.length - (comma + 1);
  return `${header}(len=${len})`;
}
function safeJsonPreview(obj: unknown, max = 4000) {
  try {
    const s = JSON.stringify(
      obj,
      (_k, v) => {
        if (typeof v === 'string' && isDataUrl(v)) return shrinkDataUrl(v);
        return v;
      },
      2
    );
    return s.length > max ? s.slice(0, max) + `…(${s.length - max} chars)` : s;
  } catch {
    return '[unserializable]';
  }
}
async function parseTextAsJson(text: string) {
  try {
    return { json: JSON.parse(text), kind: 'json' as const };
  } catch {
    return { json: null, kind: 'text' as const };
  }
}

/* ==================================
 1. Tipos de Datos (Exportados)
 ================================== */

// 1.1. Tipos para Contenido Multimedia
type MediaMessagePayload = {
  url?: string;
  mediaUrl?: string;
  mediaKey?: string;
  mimetype?: string;
  fileLength?: string | number;
  fileSha256?: string;
  fileEncSha256?: string;
  jpegThumbnail?: string;
  width?: number;
  height?: number;
  seconds?: number;
  ptt?: boolean;            // Para audio (push-to-talk)
  caption?: string;
};

// 1.2. Estructura del campo 'message'
export type MessageContent = {
  conversation?: string;
  extendedTextMessage?: { text: string };

  imageMessage?: MediaMessagePayload;
  documentMessage?: MediaMessagePayload;
  videoMessage?: MediaMessagePayload;
  audioMessage?: MediaMessagePayload;

  mediaUrl?: string;
  messageContextInfo?: Record<string, unknown>;
};

// 1.3. Definición de EvolutionMessage
export type EvolutionMessage = {
  id?: string;
  key?: { id?: string; fromMe?: boolean; remoteJid?: string; senderLid?: string };
  pushName?: string | null;
  participant?: string | null;
  messageType?: string; // 'conversation' | 'imageMessage' | 'videoMessage' | 'audioMessage' | 'documentMessage'
  message: MessageContent;
  contextInfo?: Record<string, unknown> | null;
  source?: string;
  messageTimestamp?: number;
  instanceId?: string;
  sessionId?: string | null;
  status?: string;
  MessageUpdate?: Array<any>;
};

// 1.4. Tipos para LastMessage
export type LastMessage = {
  id: string | null;
  key: { id: string; fromMe: boolean; remoteJid: string; senderLid?: string };
  pushName: string | null;
  participant: string | null;
  messageType: string;
  message: MessageContent;
  contextInfo: Record<string, unknown> | null;
  source: string;
  messageTimestamp: number;
  instanceId: string;
  sessionId: string | null;
  status: string;
};

// 🔑 Definición COMPLETA de ChatData
export type ChatData = {
  id: string | null;
  remoteJid: string;
  pushName: string | null;
  profilePicUrl: string | null;
  updatedAt?: string;
  windowStart?: string;
  windowExpires?: string;
  windowActive?: boolean;
  lastMessage: LastMessage | null;
  unreadCount: number;
  isSaved?: number | boolean;
};

type ChatArray = ChatData[];

export type FetchChatsResult =
  | { success: true; message: string; data: ChatArray }
  | { success: false; message: string };

export type FindMessagesResult =
  | {
      success: true;
      message: string;
      data: EvolutionMessage[];
      total?: number;
      pages?: number;
      currentPage?: number;
      nextPage?: number | null;
      raw?: unknown;
      queriedRemoteJid?: string;
    }
  | { success: false; message: string; raw?: unknown; queriedRemoteJid?: string };

// Resultado de envío
export type SendMessageResult =
  | { success: true; message: string; data?: unknown; remoteJid: string }
  | { success: false; message: string; raw?: unknown; remoteJid: string };

/* ==================================
 2. Utilidades Comunes
 ================================== */

function normalizeBaseUrl(url: string): string {
  const trimmed = (url || '').trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function isChatData(x: any): x is ChatData {
  return x && typeof x === 'object' && typeof x.remoteJid === 'string' && typeof x.unreadCount !== 'undefined';
}

function ensureArrayResponse(payload: unknown): ChatArray {
  const arr =
    (Array.isArray(payload) && payload) ||
    (typeof payload === 'object' &&
      payload !== null &&
      (Array.isArray((payload as any).data)
        ? (payload as any).data
        : Array.isArray((payload as any).chats)
        ? (payload as any).chats
        : null));
  if (!arr || !Array.isArray(arr)) return [];
  return arr.filter(isChatData) as ChatArray;
}

function normalizeFindMessagesPayload(payload: any) {
  // Manejo de la estructura 'messages.records'
  if (payload?.messages?.records && Array.isArray(payload.messages.records)) {
    const container = payload.messages;
    return {
      items: container.records as EvolutionMessage[],
      meta: {
        total: Number(container.total ?? 0) || undefined,
        pages: Number(container.pages ?? 0) || undefined,
        currentPage: Number(container.currentPage ?? 1) || undefined,
        nextPage: (container.currentPage < container.pages ? container.currentPage + 1 : null) ?? undefined,
      },
    };
  }
  // Manejo de array simple o 'data'
  const items =
    (Array.isArray(payload) && payload) || (payload?.data && Array.isArray(payload.data) && payload.data) || [];
  return { items: items as EvolutionMessage[], meta: {} };
}

/**
 * doRequest con logging integrado (no cambia su firma)
 * - Loguea request (url, método, apikey parcial, payload—resumen si base64)
 * - Mide tiempo de la llamada
 * - Loguea la respuesta: status y cuerpo (JSON o texto, truncado)
 * - Retorna el Response original (los llamados actuales siguen funcionando)
 */
async function doRequest(
  url: string,
  apikeyHeader: string,
  signal: AbortSignal,
  method: 'POST' | 'GET',
  bodyObj?: Record<string, any>
) {
  const label =
    `[${method}] ${new URL(url, 'http://x').pathname} • ${Date.now().toString(36)}`;

  // Log de Request
  console.log(`\n[EVOLUTION][REQ] ${label}`);
  console.log(`[EVOLUTION][REQ] url=${url}`);
  console.log(`[EVOLUTION][REQ] apikey=${maskKey(apikeyHeader)}`);
  if (bodyObj !== undefined) {
    console.log(`[EVOLUTION][REQ] body=${safeJsonPreview(bodyObj)}`);
  }
  console.time(`[EVOLUTION][TIMER] ${label}`);

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      apikey: apikeyHeader,
    },
    body: method === 'POST' ? JSON.stringify(bodyObj ?? {}) : undefined,
    cache: 'no-store',
    signal,
  });

  // Clon para leer cuerpo (sin consumir el original)
  const clone = response.clone();
  const text = await clone.text().catch(() => '');
  const parsed = await parseTextAsJson(text);

  console.timeEnd(`[EVOLUTION][TIMER] ${label}`);
  console.log(`[EVOLUTION][RES] ${label} status=${response.status} ok=${response.ok}`);
  const ctype = response.headers.get('content-type') || '';
  console.log(`[EVOLUTION][RES] ${label} content-type=${ctype}`);
  if (parsed.kind === 'json') {
    console.log(`[EVOLUTION][RES] ${label} json=${safeJsonPreview(parsed.json)}`);
  } else {
    const max = 1200;
    const preview = text.length > max ? text.slice(0, max) + `…(${text.length - max} chars)` : text;
    console.log(`[EVOLUTION][RES] ${label} text=${preview}`);
  }

  return response; // mantiene compatibilidad con el resto del código
}

/* ==================================
 3. Acciones del Servidor
 ================================== */

export async function fetchChatsFromEvolution(
  apiKeyData: Pick<ApiKey, 'url' | 'key'>,
  instanceName: string,
  options?: { timeoutMs?: number; allowInsecureTLS?: boolean; path?: 'findChats' }
): Promise<FetchChatsResult> {
  const { url: baseUrlRaw, key: globalApiKey } = apiKeyData;
  if (!baseUrlRaw || !globalApiKey || !instanceName) {
    return { success: false, message: 'Parámetros de conexión faltantes.' };
  }

  const baseURL = normalizeBaseUrl(baseUrlRaw);
  const endpointUrl = `${baseURL}/chat/findChats/${encodeURIComponent(instanceName)}`;
  const apikeyHeader = globalApiKey;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 15000);

  try {
    let response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'POST');
    if (!response.ok && (response.status === 404 || response.status === 405)) {
      response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'GET');
    }
    clearTimeout(timeout);

    const raw = await response.json().catch(() => null);

    if (!response.ok) {
      const apiMsg = (raw?.message as string) || `Error ${response.status} en la API.`;
      return { success: false, message: apiMsg };
    }

    if (raw == null) return { success: false, message: 'Respuesta inválida o vacía.' };

    const data = ensureArrayResponse(raw);
    return { success: true, message: `OK findChats ${instanceName}`, data };
  } catch (err: any) {
    clearTimeout(timeout);
    console.error('[EVOLUTION][ERR] fetchChatsFromEvolution', err);
    const errMsg =
      err?.name === 'AbortError' ? 'Timeout de solicitud.' : `Error de red: ${err?.message || String(err)}`;
    return { success: false, message: errMsg };
  }
}

export async function findMessagesByRemoteJid(
  apiKeyData: Pick<ApiKey, 'url' | 'key'>,
  instanceName: string,
  remoteJid: string,
  options?: {
    timeoutMs?: number;
    page?: number;
    pageSize?: number;
    limit?: number;
  }
): Promise<FindMessagesResult> {
  const { url: baseUrlRaw, key: globalApiKey } = apiKeyData;

  if (!baseUrlRaw || !globalApiKey || !instanceName || !remoteJid) {
    return { success: false, message: 'URL / API Key / instanceName / remoteJid faltantes.', queriedRemoteJid: remoteJid };
  }

  const baseURL = normalizeBaseUrl(baseUrlRaw);
  const endpointUrl = `${baseURL}/chat/findMessages/${encodeURIComponent(instanceName)}`;
  const apikeyHeader = globalApiKey;

  const payload: Record<string, any> = {
    where: {
      key: {
        remoteJid: remoteJid,
      },
    },
  };

  if (options?.page) payload.page = options.page;
  if (options?.pageSize) {
    payload.offset = options.pageSize;
  } else if (options?.limit) {
    payload.offset = options.limit;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 15000);

  try {
    const response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'POST', payload);
    clearTimeout(timeout);

    const raw = await response.json().catch(() => null);

    if (!response.ok) {
      const apiMsg = (raw?.message as string) || `Error ${response.status} en la API.`;
      return { success: false, message: apiMsg, raw, queriedRemoteJid: remoteJid };
    }

    if (raw == null) return { success: false, message: 'Respuesta inválida o vacía.', queriedRemoteJid: remoteJid };

    const { items, meta } = normalizeFindMessagesPayload(raw);

    return {
      success: true,
      message: `OK findMessages ${instanceName} ${remoteJid}`,
      data: items,
      total: meta.total,
      pages: meta.pages,
      currentPage: meta.currentPage,
      nextPage: meta.nextPage,
      raw,
      queriedRemoteJid: remoteJid,
    };
  } catch (err: any) {
    clearTimeout(timeout);
    console.error('[EVOLUTION][ERR] findMessagesByRemoteJid', err);
    const errMsg =
      err?.name === 'AbortError' ? 'Timeout de solicitud.' : `Error de red: ${err?.message || String(err)}`;
    return { success: false, message: errMsg, queriedRemoteJid: remoteJid };
  }
}

export async function sendTextMessage(
  apiKeyData: Pick<ApiKey, 'url' | 'key'>,
  instanceName: string,
  remoteJid: string,
  textMessage: string,
  options?: {
    timeoutMs?: number;
    delay?: number;
    quotedMessage?: { key: { id: string }; message: { conversation: string } };
    linkPreview?: boolean;
    mentionsEveryOne?: boolean;
    mentioned?: string[];
  }
): Promise<SendMessageResult> {
  const { url: baseUrlRaw, key: globalApiKey } = apiKeyData;

  if (!baseUrlRaw || !globalApiKey || !instanceName || !remoteJid || !textMessage) {
    return {
      success: false,
      message: 'Parámetros de conexión faltantes (URL, API Key, instanceName, remoteJid, o textMessage).',
      remoteJid,
    };
  }

  const baseURL = normalizeBaseUrl(baseUrlRaw);
  theMessage: {
  }
  const endpointUrl = `${baseURL}/message/sendText/${encodeURIComponent(instanceName)}`;
  const apikeyHeader = globalApiKey;

  const payload: Record<string, any> = {
    number: remoteJid,
    text: textMessage,
  };

  if (options?.delay) payload.delay = options.delay;
  if (options?.quotedMessage) payload.quoted = options.quotedMessage;
  if (options?.linkPreview !== undefined) payload.linkPreview = options.linkPreview;
  if (options?.mentionsEveryOne !== undefined) payload.mentionsEveryOne = options.mentionsEveryOne;
  if (options?.mentioned && options.mentioned.length > 0) payload.mentioned = options.mentioned;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 15000);

  try {
    const response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'POST', payload);
    clearTimeout(timeout);

    const raw = await response.json().catch(() => null);

    if (!response.ok) {
      const apiMsg = (raw?.message as string) || `Error ${response.status} en la API al enviar mensaje.`;
      return { success: false, message: apiMsg, raw, remoteJid };
    }

    if (raw == null) return { success: false, message: 'Respuesta inválida o vacía al enviar mensaje.', remoteJid };

    return {
      success: true,
      message: `Mensaje enviado OK a ${remoteJid}`,
      data: raw,
      remoteJid: remoteJid,
    };
  } catch (err: any) {
    clearTimeout(timeout);
    console.error('[EVOLUTION][ERR] sendTextMessage', err);
    const errMsg =
      err?.name === 'AbortError' ? 'Timeout de solicitud.' : `Error de red: ${err?.message || String(err)}`;
    return { success: false, message: errMsg, remoteJid };
  }
}

/* ==================================
 3.x Envío de Media por URL (foto, video, audio, documento)
 ================================== */

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface SendMediaUrlParams {
  mediatype: MediaType;               // 'image' | 'video' | 'audio' | 'document'
  mediaUrl: string;                   // URL directa del archivo (o base64 si tu instancia lo permite)
  fileName?: string;                  // Requerido para 'document'; opcional para image/video/audio
  mimetype?: string;                  // Recomendado (p.ej. 'image/png', 'video/mp4', 'audio/mpeg', 'application/pdf')
  caption?: string;                   // Título / descripción (se muestra en image/video/document)
  ptt?: boolean;                      // Para audio tipo nota de voz (push-to-talk)
  delay?: number;
  linkPreview?: boolean;
  mentionsEveryOne?: boolean;
  mentioned?: string[];               // Lista de JIDs
  quotedMessage?: {                   // Responder a un mensaje
    key: { id: string };
    message: { conversation: string };
  };
}

/**
 * Envía imagen, video, audio o documento por URL usando el endpoint:
 *   POST /message/send-media-url/{instance}
 * Si tu instancia no tiene ese endpoint, hace fallback a:
 *   POST /message/sendMedia/{instance}
 */
export async function sendMediaByUrl(
  apiKeyData: Pick<ApiKey, 'url' | 'key'>,
  instanceName: string,
  remoteJid: string,
  params: SendMediaUrlParams,
  options?: { timeoutMs?: number }
): Promise<SendMessageResult> {
  const { url: baseUrlRaw, key: globalApiKey } = apiKeyData;

  if (!baseUrlRaw || !globalApiKey || !instanceName || !remoteJid) {
    return { success: false, message: 'Parámetros faltantes (URL/API Key/instanceName/remoteJid).', remoteJid };
  }

  if (!params?.mediaUrl || !params?.mediatype) {
    return { success: false, message: 'Faltan campos en params: mediatype y mediaUrl son obligatorios.', remoteJid };
  }

  if (params.mediatype === 'document' && !params.fileName) {
    return { success: false, message: 'Para mediatype=document debes indicar fileName.', remoteJid };
  }

  const baseURL = normalizeBaseUrl(baseUrlRaw);
  const endpointPrimary = `${baseURL}/message/send-media-url/${encodeURIComponent(instanceName)}`;
  const endpointFallback = `${baseURL}/message/sendMedia/${encodeURIComponent(instanceName)}`;
  const apikeyHeader = globalApiKey;

  // Construimos cuerpo común
  const body: Record<string, any> = {
    number: remoteJid,
    mediatype: params.mediatype,      // 'image' | 'video' | 'audio' | 'document'
    media: params.mediaUrl,           // URL o base64
  };

  // Campos opcionales
  if (params.caption) body.caption = params.caption;
  if (params.mimetype) body.mimetype = params.mimetype;
  if (params.fileName) body.fileName = params.fileName;
  if (typeof params.ptt === 'boolean') body.ptt = params.ptt;

  if (typeof params.delay === 'number') body.delay = params.delay;
  if (typeof params.linkPreview === 'boolean') body.linkPreview = params.linkPreview;
  if (typeof params.mentionsEveryOne === 'boolean') body.mentionsEveryOne = params.mentionsEveryOne;
  if (Array.isArray(params.mentioned) && params.mentioned.length > 0) body.mentioned = params.mentioned;
  if (params.quotedMessage) body.quoted = params.quotedMessage;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 20000);

  try {
    // 1) Intento con send-media-url
    let response = await doRequest(endpointPrimary, apikeyHeader, controller.signal, 'POST', body);

    // 2) Fallback si la ruta no existe o el método no está permitido
    if (!response.ok && (response.status === 404 || response.status === 405)) {
      response = await doRequest(endpointFallback, apikeyHeader, controller.signal, 'POST', body);
    }

    clearTimeout(timeout);
    const raw = await response.json().catch(() => null);

    if (!response.ok) {
      const apiMsg = (raw?.message as string) || `Error ${response.status} al enviar media.`;
      return { success: false, message: apiMsg, raw, remoteJid };
    }

    if (raw == null) return { success: false, message: 'Respuesta inválida o vacía al enviar media.', remoteJid };

    return {
      success: true,
      message: `Media (${params.mediatype}) enviada a ${remoteJid}`,
      data: raw,
      remoteJid,
    };
  } catch (err: any) {
    clearTimeout(timeout);
    console.error('[EVOLUTION][ERR] sendMediaByUrl', err);
    const errMsg = err?.name === 'AbortError' ? 'Timeout de solicitud.' : `Error de red: ${err?.message || String(err)}`;
    return { success: false, message: errMsg, remoteJid };
  }
}

/* ==================================
 Ejemplos de uso (referencia rápida)
 ================================== */
/*
await sendMediaByUrl(apiKey, 'mi-instancia', '5215551112222@s.whatsapp.net', {
  mediatype: 'image',
  mediaUrl: 'https://mi-cdn.com/fotos/portada.png',
  fileName: 'portada.png',
  mimetype: 'image/png',
  caption: '🚀 Nueva portada'
});

await sendMediaByUrl(apiKey, 'mi-instancia', '5215551112222@s.whatsapp.net', {
  mediatype: 'video',
  mediaUrl: 'https://mi-cdn.com/videos/demo.mp4',
  fileName: 'demo.mp4',
  mimetype: 'video/mp4',
  caption: 'Demo en 30s'
});

await sendMediaByUrl(apiKey, 'mi-instancia', '5215551112222@s.whatsapp.net', {
  mediatype: 'audio',
  mediaUrl: 'https://mi-cdn.com/audios/nota-voz.m4a',
  mimetype: 'audio/mp4',
  ptt: true,           // true => se envía como nota de voz (si tu instancia lo soporta)
  delay: 1000
});

await sendMediaByUrl(apiKey, 'mi-instancia', '5215551112222@s.whatsapp.net', {
  mediatype: 'document',
  mediaUrl: 'https://mi-cdn.com/catalogo.pdf',
  fileName: 'catalogo.pdf',
  mimetype: 'application/pdf',
  caption: 'Catálogo 2025'
});
*/

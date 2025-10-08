'use server';

import type { ApiKey } from '@prisma/client';
import { Buffer } from 'buffer';

/* ==================================
0. Utilidades de Logging y Base64
================================== */

function maskKey(k?: string) {
  if (!k) return '';
  if (k.length <= 8) return '****';
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}

function isDataUrl(v?: string) {
  return !!v && /^data:[^;]+;base64,/i.test(v);
}

/** ⚠️ Útil para logs generales (NO se usa para `media` completo) */
function safeJsonPreview(obj: unknown, max = 4000) {
  try {
    const s = JSON.stringify(obj, null, 2);
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
  ptt?: boolean;
  caption?: string;
};

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

export type EvolutionMessage = {
  id?: string;
  key?: { id?: string; fromMe?: boolean; remoteJid?: string; senderLid?: string };
  pushName?: string | null;
  participant?: string | null;
  messageType?: string;
  message: MessageContent;
  contextInfo?: Record<string, unknown> | null;
  source?: string;
  messageTimestamp?: number;
  instanceId?: string;
  sessionId?: string | null;
  status?: string;
  MessageUpdate?: Array<any>;
};

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

export type SendMessageResult =
  | { success: true; message: string; data?: unknown; remoteJid: string }
  | { success: false; message: string; raw?: unknown; remoteJid: string };

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface SendMediaUrlParams {
  mediatype: MediaType;
  /**
   * Puede ser:
   *  - Data URL (se extrae y se usa SOLO la parte base64)
   *  - URL http(s) (para audio se manda como URL; para otros se convierte a base64 “puro”)
   *  - Base64 “puro”
   */
  mediaUrl: string;
  fileName?: string;
  mimetype?: string;
  caption?: string;
  ptt?: boolean;
  delay?: number;
  linkPreview?: boolean;
  mentionsEveryOne?: boolean;
  mentioned?: string[];
  quotedMessage?: {
    key: { id: string };
    message: { conversation: string };
  };
}

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
  const items =
    (Array.isArray(payload) && payload) || (payload?.data && Array.isArray(payload.data) && payload.data) || [];
  return { items: items as EvolutionMessage[], meta: {} };
}

/**
 * doRequest con logging explícito del campo `media`/`audio` cuando shouldLog=true
 */
async function doRequest(
  url: string,
  apikeyHeader: string,
  signal: AbortSignal,
  method: 'POST' | 'GET',
  bodyObj?: Record<string, any>,
  shouldLog: boolean = false
) {
  const label = `[${method}] ${new URL(url, 'http://x').pathname} • ${Date.now().toString(36)}`;

  if (shouldLog) {
    console.log(`\n[EVOLUTION][REQ] ${label}`);
    console.log(`[EVOLUTION][REQ] url=${url}`);
    console.log(`[EVOLUTION][REQ] apikey=${maskKey(apikeyHeader)}`);
    if (bodyObj !== undefined) {
      console.log(
        `[EVOLUTION][REQ] body(preview)=${safeJsonPreview({
          ...bodyObj,
          media: bodyObj.media ? `[base64 length=${String(bodyObj.media).length}]` : undefined,
          audio:
            typeof bodyObj.audio === 'string'
              ? bodyObj.encoding
                ? `[base64 length=${bodyObj.audio.length}]`
                : '[url]'
              : bodyObj.audio,
        })}`
      );
      if (typeof bodyObj.media === 'string') {
        console.log(`[EVOLUTION][REQ] body.media(EXACT)=${bodyObj.media}`);
      }
      if (typeof bodyObj.audio === 'string' && bodyObj.encoding === true) {
        console.log(`[EVOLUTION][REQ] body.audio(EXACT)=${bodyObj.audio}`);
      }
    }
    console.time(`[EVOLUTION][TIMER] ${label}`);
  }

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

  const clone = response.clone();
  const text = await clone.text().catch(() => '');
  const parsed = await parseTextAsJson(text);

  if (shouldLog) {
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
  }

  return response;
}

/* ==================================
3. Acciones del Servidor (Chats/Mensajes)
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
    const errMsg = err?.name === 'AbortError' ? 'Timeout de solicitud.' : `Error de red: ${err?.message || String(err)}`;
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
  if (options?.pageSize) payload.offset = options.pageSize;
  else if (options?.limit) payload.offset = options.limit;

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
    const errMsg = err?.name === 'AbortError' ? 'Timeout de solicitud.' : `Error de red: ${err?.message || String(err)}`;
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
    const response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'POST', payload, true);
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
    const errMsg = err?.name === 'AbortError' ? 'Timeout de solicitud.' : `Error de red: ${err?.message || String(err)}`;
    return { success: false, message: errMsg, remoteJid };
  }
}

/* ==================================
4. Conversión a BASE64 “puro” (sin data:)
================================== */

/** File → base64 “puro” */
async function fileToBase64Raw(file: File): Promise<{ base64: string; mime: string }> {
  const mime = file.type || 'application/octet-stream';
  const ab = await file.arrayBuffer();
  const b64 = Buffer.from(ab).toString('base64').replace(/(\r\n|\n|\r)/gm, '');
  return { base64: b64, mime };
}

/** Buffer → base64 “puro” */
function bufferToBase64Raw(buffer: Buffer): string {
  return buffer.toString('base64').replace(/(\r\n|\n|\r)/gm, '');
}

/** Descarga URL → base64 “puro” + mime + fileName? */
async function fetchUrlToBase64(url: string, hintedMime?: string) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`No se pudo descargar la media: ${res.status}`);
  const mime = hintedMime || res.headers.get('content-type') || 'application/octet-stream';
  const ab = await res.arrayBuffer();
  const base64 = bufferToBase64Raw(Buffer.from(ab));
  const urlName = (() => {
    try {
      const u = new URL(url);
      const last = u.pathname.split('/').filter(Boolean).pop();
      return last || undefined;
    } catch {
      return undefined;
    }
  })();
  return { base64, mime, fileName: urlName };
}

/** Normalización tolerante de Base64 (URL-safe, padding, etc.) */
function normalizeBase64(b64: string): string {
  let s = (b64 || '').trim();

  // Base64 URL-safe → estándar
  s = s.replace(/-/g, '+').replace(/_/g, '/');

  // quitar espacios/linebreaks ya se hace antes, pero por si acaso:
  s = s.replace(/(\s|\r\n|\n|\r)/g, '');

  // Padding a múltiplo de 4
  const mod = s.length % 4;
  if (mod === 2) s += '==';
  else if (mod === 3) s += '=';
  else if (mod === 1) {
    throw new Error('Cadena base64 inválida (longitud no válida).');
  }

  return s;
}

/**
 * Normaliza un string a base64 “puro” (tolerante):
 *  - data:<mime>;base64,AAAA → extrae y normaliza
 *  - http(s):// → descarga y convierte a base64
 *  - base64 crudo (URL-safe o sin padding) → normaliza + valida decodificando
 */
async function ensureBase64FromString(
  mediaUrl: string,
  mimetype?: string
): Promise<{ base64: string; mime: string; inferredName?: string }> {
  const input = (mediaUrl || '').trim();

  // 1) Data URL
  if (isDataUrl(input)) {
    const commaIdx = input.indexOf(',');
    const header = input.slice(0, commaIdx);
    const match = header.match(/^data:([^;]+);base64/i);
    const mime = match?.[1] || mimetype || 'application/octet-stream';
    const raw = input.slice(commaIdx + 1).replace(/(\s|\r\n|\n|\r)/g, '');
    const base64 = normalizeBase64(raw);
    // Validación decode
    Buffer.from(base64, 'base64');
    return { base64, mime };
  }

  // 2) http(s) URL
  if (/^https?:\/\//i.test(input)) {
    const { base64, mime, fileName } = await fetchUrlToBase64(input, mimetype);
    // Validación decode
    Buffer.from(base64, 'base64');
    return { base64, mime, inferredName: fileName };
  }

  // 3) base64 crudo
  const cleaned = input.replace(/^base64,?/i, '').replace(/(\s|\r\n|\n|\r)/g, '');
  const base64 = normalizeBase64(cleaned);
  const mime = mimetype || 'application/octet-stream';

  // Validación pragmática: intentar decodificar
  Buffer.from(base64, 'base64');
  return { base64, mime };
}

/* ==================================
5A. Envío de AUDIO (usa body { number, audio, encoding })
================================== */

/**
 * Envía audio usando el endpoint de Evolution que acepta:
 * { number, audio: <url | base64>, encoding?: true, ... }
 *
 * - Si `audioSource` es http(s):// → se manda como URL (sin encoding).
 * - Si es Data URL o base64 → se manda como base64 + encoding:true.
 */
export async function sendAudio(
  apiKeyData: Pick<ApiKey, 'url' | 'key'>,
  instanceName: string,
  remoteJid: string,
  audioSource: string,
  options?: {
    timeoutMs?: number;
    delay?: number;
    quotedMessage?: { key: { id: string }; message: { conversation: string } };
    mentionsEveryOne?: boolean;
    mentioned?: string[];
    ptt?: boolean; // opcional
    mimetype?: string;
    /** fuerza convertir http(s) a base64 + encoding:true */
    forceBase64?: boolean;
  }
): Promise<SendMessageResult> {
  const { url: baseUrlRaw, key: globalApiKey } = apiKeyData;

  if (!baseUrlRaw || !globalApiKey || !instanceName || !remoteJid || !audioSource) {
    return { success: false, message: 'Parámetros faltantes para audio.', remoteJid };
  }

  const baseURL = normalizeBaseUrl(baseUrlRaw);
  const endpointUrl = `${baseURL}/message/sendWhatsAppAudio/${encodeURIComponent(instanceName)}`;
  const apikeyHeader = globalApiKey;

  let audioField = audioSource;
  let encoding = false;

  const isHttp = /^https?:\/\//i.test(audioSource);

  if (!isHttp || options?.forceBase64) {
    // Data URL o base64 crudo (o URL forzada) → normalizamos a base64 “puro”
    const { base64 } = await ensureBase64FromString(audioSource, options?.mimetype || 'audio/ogg');
    audioField = base64;
    encoding = true;
  }

  const body: Record<string, any> = {
    number: remoteJid,
    audio: audioField,
  };

  if (encoding) body.encoding = true; // requerido cuando va base64
  if (typeof options?.delay === 'number') body.delay = options.delay;
  if (options?.quotedMessage) body.quoted = options.quotedMessage;
  if (typeof options?.mentionsEveryOne === 'boolean') body.mentionsEveryOne = options.mentionsEveryOne;
  if (Array.isArray(options?.mentioned) && options!.mentioned!.length > 0) body.mentioned = options!.mentioned;
  if (typeof options?.ptt === 'boolean') body.ptt = options.ptt;

  // Logs
  console.log(`[SENDAUDIO] number=${remoteJid} encoding=${encoding}`);
  if (encoding) {
    console.log(`[SENDAUDIO][EXACT audio base64] length=${String(audioField).length}`);
    console.log(audioField);
  } else {
    console.log(`[SENDAUDIO] audio=url:${audioField}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 20000);

  try {
    const response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'POST', body, true);
    clearTimeout(timeout);
    const raw = await response.json().catch(() => null);

    if (!response.ok) {
      const apiMsg = (raw?.message as string) || `Error ${response.status} al enviar audio.`;
      return { success: false, message: apiMsg, raw, remoteJid };
    }

    if (raw == null) return { success: false, message: 'Respuesta inválida o vacía al enviar audio.', remoteJid };

    return {
      success: true,
      message: `Audio enviado a ${remoteJid}`,
      data: raw,
      remoteJid,
    };
  } catch (err: any) {
    clearTimeout(timeout);
    const errMsg = err?.name === 'AbortError' ? 'Timeout de solicitud.' : `Error de red: ${err?.message || String(err)}`;
    return { success: false, message: errMsg, remoteJid };
  }
}

/* ==================================
5B. Envío de Media genérico (image/video/document) → media = base64 puro
   (para audio ahora se delega a sendAudio)
================================== */

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

  // AUDIO → endpoint/body específico { number, audio, encoding }
  if (params.mediatype === 'audio') {
    return sendAudio(apiKeyData, instanceName, remoteJid, params.mediaUrl, {
      timeoutMs: options?.timeoutMs,
      delay: params.delay,
      quotedMessage: params.quotedMessage,
      mentionsEveryOne: params.mentionsEveryOne,
      mentioned: params.mentioned,
      ptt: params.ptt,
      mimetype: params.mimetype,
    });
  }

  const baseURL = normalizeBaseUrl(baseUrlRaw);
  const endpointUrl = `${baseURL}/message/sendMedia/${encodeURIComponent(instanceName)}`;
  const apikeyHeader = globalApiKey;

  // ⇨ Normalizar a base64 “puro”
  const normalized = await ensureBase64FromString(params.mediaUrl, params.mimetype);

  // fileName si es documento
  let finalFileName = params.fileName || normalized.inferredName;
  if (params.mediatype === 'document' && !finalFileName) {
    const extFromMime = (() => {
      const m = (normalized.mime || '').toLowerCase();
      if (m.includes('pdf')) return 'pdf';
      if (m.includes('zip')) return 'zip';
      if (m.includes('msword')) return 'doc';
      if (m.includes('excel')) return 'xls';
      if (m.includes('powerpoint')) return 'ppt';
      if (m.includes('text')) return 'txt';
      if (m.includes('json')) return 'json';
      if (m.includes('csv')) return 'csv';
      if (m.includes('png')) return 'png';
      if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
      if (m.includes('mp4')) return 'mp4';
      if (m.includes('mp3')) return 'mp3';
      return 'bin';
    })();
    finalFileName = `file.${extFromMime}`;
  }

  const body: Record<string, any> = {
    number: remoteJid,
    mediatype: params.mediatype,
    mimetype: normalized.mime,
    caption: params.caption,
    media: normalized.base64, // 👈 SOLO base64
    fileName: finalFileName,
  };

  if (typeof params.delay === 'number') body.delay = params.delay;
  if (typeof params.linkPreview === 'boolean') body.linkPreview = params.linkPreview;
  if (typeof params.mentionsEveryOne === 'boolean') body.mentionsEveryOne = params.mentionsEveryOne;
  if (Array.isArray(params.mentioned) && params.mentioned.length > 0) body.mentioned = params.mentioned;
  if (params.quotedMessage) body.quoted = params.quotedMessage;

  // 🔎 Log EXACTO del base64 que se envía en `media`
  console.log(`[SENDMEDIA][EXACT media] length=${String(body.media).length}`);
  console.log(body.media);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 20000);

  try {
    const response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'POST', body, true);

    clearTimeout(timeout);
    const raw = await response.json().catch(() => null);

    if (!response.ok) {
      const errorResponse = raw?.response?.message;
      const apiMsg =
        (Array.isArray(errorResponse) ? errorResponse.join(', ') : (errorResponse as string) || (raw?.message as string)) ||
        `Error ${response.status} al enviar media.`;
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
    const errMsg = err?.name === 'AbortError' ? 'Timeout de solicitud.' : `Error de red: ${err?.message || String(err)}`;
    return { success: false, message: errMsg, remoteJid };
  }
}

/* ==================================
6. Atajos: File → base64 puro y envío
================================== */

export async function sendFileBase64(
  apiKeyData: Pick<ApiKey, 'url' | 'key'>,
  instanceName: string,
  remoteJid: string,
  file: File,
  caption?: string
): Promise<SendMessageResult> {
  try {
    const { base64, mime } = await fileToBase64Raw(file);

    let mediatype: MediaType;
    if (mime.startsWith('image/')) mediatype = 'image';
    else if (mime.startsWith('video/')) mediatype = 'video';
    else if (mime.startsWith('audio/')) mediatype = 'audio';
    else mediatype = 'document';

    const fileName = file.name;

    return await sendMediaByUrl(apiKeyData, instanceName, remoteJid, {
      mediatype,
      mediaUrl: base64, // 👈 base64 puro
      mimetype: mime,
      fileName,
      caption,
    });
  } catch (error: any) {
    console.error('[NEXTJS][ERR] sendFileBase64', error);
    return {
      success: false,
      message: `Error en la preparación/conversión: ${error?.message || String(error)}`,
      remoteJid,
    };
  }
}

/* ==================================
7. Envío unificado (File | string) → audio/media
================================== */

function mediaTypeFromMime(mime: string): MediaType {
  const m = (mime || '').toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  return 'document';
}

/**
 * Acepta File o string (data:, http(s), base64) y envía:
 *  - AUDIO → `sendAudio` con body { number, audio, encoding }
 *  - Otros  → `sendMediaByUrl` (media base64)
 */
export async function sendMediaAuto(
  apiKeyData: Pick<ApiKey, 'url' | 'key'>,
  instanceName: string,
  remoteJid: string,
  source: File | string,
  hinted?: {
    mimetype?: string;
    mediatype?: MediaType;
    fileName?: string;
    caption?: string;
    ptt?: boolean;
    delay?: number;
    linkPreview?: boolean;
    mentionsEveryOne?: boolean;
    mentioned?: string[];
    quotedMessage?: { key: { id: string }; message: { conversation: string } };
    timeoutMs?: number;
    /** para audio: fuerza transformar URL http(s) a base64 + encoding:true */
    forceAudioBase64?: boolean;
  }
): Promise<SendMessageResult> {
  // mime inferido / provisto
  let mime = hinted?.mimetype || 'application/octet-stream';
  let fileName = hinted?.fileName;

  if (typeof source !== 'string') {
    mime = source.type || mime;
    fileName = fileName || source.name;
  }

  const mediatype: MediaType = hinted?.mediatype || mediaTypeFromMime(mime);

  // AUDIO → usar cuerpo { number, audio, encoding }
  if (mediatype === 'audio') {
    let audioSourceStr: string;
    if (typeof source !== 'string') {
      const { base64 } = await fileToBase64Raw(source);
      audioSourceStr = base64; // base64 puro
    } else {
      audioSourceStr = source; // data:, http(s) o base64 puro
    }

    return sendAudio(apiKeyData, instanceName, remoteJid, audioSourceStr, {
      timeoutMs: hinted?.timeoutMs,
      delay: hinted?.delay,
      quotedMessage: hinted?.quotedMessage,
      mentionsEveryOne: hinted?.mentionsEveryOne,
      mentioned: hinted?.mentioned,
      ptt: hinted?.ptt,
      mimetype: mime,
      forceBase64: hinted?.forceAudioBase64,
    });
  }

  // IMAGE/VIDEO/DOCUMENT → flujo clásico
  let mediaUrlStr: string;
  if (typeof source !== 'string') {
    const { base64 } = await fileToBase64Raw(source);
    mediaUrlStr = base64; // base64 puro
  } else {
    mediaUrlStr = source;
  }

  return sendMediaByUrl(
    apiKeyData,
    instanceName,
    remoteJid,
    {
      mediatype,
      mediaUrl: mediaUrlStr,
      mimetype: mime,
      fileName,
      caption: hinted?.caption,
      delay: hinted?.delay,
      linkPreview: hinted?.linkPreview,
      mentionsEveryOne: hinted?.mentionsEveryOne,
      mentioned: hinted?.mentioned,
      quotedMessage: hinted?.quotedMessage,
    },
    { timeoutMs: hinted?.timeoutMs }
  );
}

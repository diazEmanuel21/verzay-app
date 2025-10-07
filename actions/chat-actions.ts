'use server';

import type { ApiKey } from '@prisma/client';
import { Buffer } from 'buffer'; // 🔑 Importación necesaria para Node.js/Server Actions

/* ==================================
0. Utilidades de Logging y Base64
================================== */

function maskKey(k?: string) {
  if (!k) return '';
  if (k.length <= 8) return '****';
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}
function isDataUrl(v?: string) {
  // Verifica si es un Data URL (que incluye Base64)
  return !!v && /^data:[^;]+;base64,/i.test(v);
}
function shrinkDataUrl(v?: string) {
  if (!v) return v;
  if (!isDataUrl(v)) return v;
  const comma = v.indexOf(',');
  const header = v.slice(0, comma + 1);
  const len = v.length - (comma + 1);
  // Muestra el tipo y la longitud en el log, NO el Base64 completo
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
  ptt?: boolean;
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

// Definición COMPLETA de ChatData
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

// Nuevo tipo para el resultado del envío de mensaje
export type SendMessageResult =
  | { success: true; message: string; data?: unknown; remoteJid: string }
  | { success: false; message: string; raw?: unknown; remoteJid: string };

// 🔑 Tipos para Envío de Media (AÑADIDOS)
export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface SendMediaUrlParams {
  mediatype: MediaType;
  /** * ⚠️ IMPORTANTE: Debe ser la cadena Base64 completa (Data URL) o la URL directa.
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
  // Manejo de la estructura de array simple o 'data'
  const items =
    (Array.isArray(payload) && payload) || (payload?.data && Array.isArray(payload.data) && payload.data) || [];
  return { items: items as EvolutionMessage[], meta: {} };
}

/**
 * doRequest con logging integrado. (MODIFICADA para incluir logging)
 */
async function doRequest(
  url: string,
  apikeyHeader: string,
  signal: AbortSignal,
  method: 'POST' | 'GET',
  bodyObj?: Record<string, any>,
  // 💡 CAMBIO CLAVE: shouldLog ahora es false por defecto
  shouldLog: boolean = false // 👈 VALOR PREDETERMINADO CAMBIADO A 'false'
) {
  const label = `[${method}] ${new URL(url, 'http://x').pathname} • ${Date.now().toString(36)}`;

  // 💡 Log de Request (condicional)
  if (shouldLog) {
    console.log(`\n[EVOLUTION][REQ] ${label}`);
    console.log(`[EVOLUTION][REQ] url=${url}`);
    console.log(`[EVOLUTION][REQ] apikey=${maskKey(apikeyHeader)}`);
    if (bodyObj !== undefined) {
      // Aquí se usa el preview para NO imprimir todo el Base64 en el log
      console.log(`[EVOLUTION][REQ] body=${safeJsonPreview(bodyObj)}`);
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
    // Se envía el bodyObj ORIGINAL
    body: method === 'POST' ? JSON.stringify(bodyObj ?? {}) : undefined,
    cache: 'no-store',
    signal,
  });

  // Clon para leer cuerpo (sin consumir el original)
  const clone = response.clone();
  const text = await clone.text().catch(() => '');
  const parsed = await parseTextAsJson(text);

  // 💡 Log de Respuesta (condicional)
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

  return response; // mantiene compatibilidad con el resto del código
}

/* ==================================
3. Acciones del Servidor (existentes)
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
    // ❌ NO se pasa 'true' para shouldLog, usa el valor por defecto 'false'
    let response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'POST');
    if (!response.ok && (response.status === 404 || response.status === 405)) {
      // ❌ NO se pasa 'true' para shouldLog
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

  if (options?.page) {
    payload.page = options.page;
  }
  // NOTA: Evolution usa 'offset' para el tamaño de la página o límite, ajustamos aquí:
  if (options?.pageSize) {
    payload.offset = options.pageSize;
  } else if (options?.limit) {
    payload.offset = options.limit;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 15000);

  try {
    // ❌ NO se pasa 'true' para shouldLog, usa el valor por defecto 'false'
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
    // 🟢 CAMBIO: Se pasa 'true' para habilitar el log en el envío de mensaje
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
4. Conversión y Envío de Media (Base64) (AÑADIDAS)
================================== */

/**
 * Función de utilidad: Convierte un objeto File a una cadena Base64 Data URL.
 */
async function fileToBase64DataUrl(file: File): Promise<{ dataUrl: string; mime: string }> {
  const mime = file.type;
  if (!mime) {
    throw new Error('No se pudo determinar el tipo MIME del archivo.');
  }

  // 1. Convertir el File a Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 2. Codificar a Base64 y limpiar de cualquier salto de línea
  let base64String = buffer.toString('base64');
  base64String = base64String.replace(/(\r\n|\n|\r)/gm, '');

  // 3. Crear el Data URL: data:[mimetype];base64,[cadena_base64]
  const dataUrl = `data:${mime};base64,${base64String}`;

  return { dataUrl, mime };
}

/**
 * Convierte un Buffer a Data URL Base64
 */
function bufferToDataUrl(mime: string, buffer: Buffer): string {
  if (!mime) throw new Error('MIME requerido para Data URL');
  let base64String = buffer.toString('base64').replace(/(\r\n|\n|\r)/gm, '');
  return `data:${mime};base64,${base64String}`;
}

/**
 * Descarga una URL y devuelve { dataUrl, mime, fileName? }
 * Usa el header Content-Type si no se provee mimetype.
 */
async function fetchUrlToDataUrl(url: string, hintedMime?: string) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`No se pudo descargar la media: ${res.status}`);
  const mime = hintedMime || res.headers.get('content-type') || 'application/octet-stream';

  const ab = await res.arrayBuffer();
  const buf = Buffer.from(ab);
  const dataUrl = bufferToDataUrl(mime, buf);
  // Intento simple de nombre de archivo desde la URL
  const urlName = (() => {
    try {
      const u = new URL(url);
      const last = u.pathname.split('/').filter(Boolean).pop();
      return last || undefined;
    } catch {
      return undefined;
    }
  })();

  return { dataUrl, mime, fileName: urlName };
}

/**
 * Si es Data URL, lo devuelve tal cual.
 * Si es http/https, lo descarga y lo convierte a Data URL.
 * Si parece base64 sin prefijo, lo normaliza a Data URL usando el mimetype dado.
 */
async function ensureDataUrlFromString(
  mediaUrl: string,
  mimetype?: string
): Promise<{ dataUrl: string; mime: string; inferredName?: string }> {
  if (isDataUrl(mediaUrl)) {
    // data:<mime>;base64,<...>
    // Intentar extraer el mime del header
    const header = mediaUrl.slice(0, mediaUrl.indexOf(','));
    const match = header.match(/^data:([^;]+);base64/i);
    const mime = match?.[1] || mimetype || 'application/octet-stream';
    return { dataUrl: mediaUrl, mime };
  }

  if (/^https?:\/\//i.test(mediaUrl)) {
    const { dataUrl, mime, fileName } = await fetchUrlToDataUrl(mediaUrl, mimetype);
    return { dataUrl, mime, inferredName: fileName };
  }

  // Cadena base64 “pura” sin prefijo data:
  // Requiere mimetype para construir el Data URL correctamente
  if (/^[a-z0-9+/=\r\n]+$/i.test(mediaUrl.replace(/\s+/g, ''))) {
    const b64 = mediaUrl.replace(/(\r\n|\n|\r|\s)/gm, '');
    const mime = mimetype || 'application/octet-stream';
    const dataUrl = `data:${mime};base64,${b64}`;
    return { dataUrl, mime };
  }

  throw new Error('mediaUrl debe ser una Data URL, una URL http(s), o una cadena base64 válida.');
}

/**
 * Envía media usando una URL (Base64 Data URL o URL directa).
 * Siempre normaliza a Data URL Base64 antes de enviar.
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
    // Permitimos inferir luego; si no hay ni inferido ni provisto, aplicamos default abajo
  }

  const baseURL = normalizeBaseUrl(baseUrlRaw);
  const endpointUrl = `${baseURL}/message/sendMedia/${encodeURIComponent(instanceName)}`;
  const apikeyHeader = globalApiKey;

  // ⇨ Siempre convertir/normalizar a Data URL antes de enviar
  const normalized = await ensureDataUrlFromString(params.mediaUrl, params.mimetype);

  // Preparar fileName final si procede (especialmente para documentos)
  let finalFileName = params.fileName || normalized.inferredName;
  if (params.mediatype === 'document' && !finalFileName) {
    // Nombre mínimo por defecto si no lo proveen
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

  // CONSTRUCCIÓN DEL BODY SEGÚN EL MODELO DE EVOLUTION
  const body: Record<string, any> = {
    number: remoteJid,
    mediatype: params.mediatype,
    mimetype: normalized.mime,      // usar el mime final
    caption: params.caption,
    media: normalized.dataUrl,      // 👈 SIEMPRE Data URL Base64
    fileName: finalFileName,
  };

  // Campos opcionales (Opciones)
  if (typeof params.ptt === 'boolean') body.ptt = params.ptt;
  if (typeof params.delay === 'number') body.delay = params.delay;
  if (typeof params.linkPreview === 'boolean') body.linkPreview = params.linkPreview;
  if (typeof params.mentionsEveryOne === 'boolean') body.mentionsEveryOne = params.mentionsEveryOne;
  if (Array.isArray(params.mentioned) && params.mentioned.length > 0) body.mentioned = params.mentioned;
  if (params.quotedMessage) body.quoted = params.quotedMessage;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 20000);

  try {
    // 🟢 CAMBIO: Se pasa 'true' para habilitar el log en el envío de media
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

/**
 * Maneja la subida del archivo, la conversión a Base64, y el envío.
 */
export async function sendFileBase64(
  apiKeyData: Pick<ApiKey, 'url' | 'key'>,
  instanceName: string,
  remoteJid: string,
  file: File,
  caption?: string
): Promise<SendMessageResult> {
  try {
    // 1. Convertir el archivo a Base64 (Server-side)
    const { dataUrl, mime } = await fileToBase64DataUrl(file);

    // 2. Determinar el tipo de medio
    let mediatype: MediaType;
    if (mime.startsWith('image/')) {
      mediatype = 'image';
    } else if (mime.startsWith('video/')) {
      mediatype = 'video';
    } else if (mime.startsWith('audio/')) {
      mediatype = 'audio';
    } else {
      mediatype = 'document'; // Default para otros tipos
    }

    // Nombre del archivo para el envío
    const fileName = file.name;

    // 3. Llamar a la función de envío de la API con la cadena Base64
    // 🟢 sendMediaByUrl llamará a doRequest con 'true' para el log
    return await sendMediaByUrl(apiKeyData, instanceName, remoteJid, {
      mediatype,
      mediaUrl: dataUrl, // 👈 Se envía el Base64
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

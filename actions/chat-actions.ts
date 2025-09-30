'use server';

import type { ApiKey } from '@prisma/client';

/* =========================
   Tipos existentes (tuyos)
   ========================= */
type LastMessage = {
  id: string | null;
  key: { id: string; fromMe: boolean; remoteJid: string };
  pushName: string | null;
  participant: string | null;
  messageType: string;
  message: {
    conversation?: string;
    imageMessage?: Record<string, unknown>;
    documentMessage?: Record<string, unknown>;
    messageContextInfo?: Record<string, unknown>;
  };
  contextInfo: Record<string, unknown> | null;
  source: string;
  messageTimestamp: number;
  instanceId: string;
  sessionId: string | null;
  status: string;
};

type ChatData = {
  id: string | null;
  remoteJid: string;
  pushName: string | null;
  profilePicUrl: string | null;
  updatedAt: string;
  windowStart: string;
  windowExpires: string;
  windowActive: boolean;
  lastMessage: LastMessage | null;
  unreadCount: number;
  isSaved: number | boolean;
};

type ChatArray = ChatData[];

type FetchChatsResult =
  | { success: true; message: string; data: ChatArray }
  | { success: false; message: string };

/* =========================
   Tipos NUEVOS (mensajes)
   ========================= */
export type EvolutionMessage = {
  id?: string;
  key?: { id?: string; fromMe?: boolean; remoteJid?: string };
  messageType?: string;
  messageTimestamp?: number; // epoch (seconds) normalmente
  pushName?: string | null;
  participant?: string | null;
  status?: string;
  /** payload crudo: conversation/imageMessage/documentMessage/etc */
  message?: Record<string, unknown>;
  /** información adicional si la API la devuelve */
  contextInfo?: Record<string, unknown> | null;
  /** compat: algunas variantes devuelven "remoteJid" a nivel raíz */
  remoteJid?: string;
};

export type FindMessagesResult =
  | {
      success: true;
      message: string;
      /** lista de mensajes normalizada */
      data: EvolutionMessage[];
      /** metadatos opcionales si la API los devuelve */
      total?: number;
      pages?: number;
      currentPage?: number;
      nextPage?: number | null;
      /** crudo por si quieres depurar */
      raw?: unknown;
    }
  | { success: false; message: string; raw?: unknown };

/* ===============
   Utils
   =============== */
function normalizeBaseUrl(url: string): string {
  const trimmed = (url || '').trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function isChatData(x: any): x is ChatData {
  return x && typeof x === 'object' && typeof x.remoteJid === 'string' && typeof x.windowActive !== 'undefined';
}

/** Soporta { data: [...] } | { chats: [...] } | { contacts: [...] } | [ ... ] */
function ensureArrayResponse(payload: unknown): ChatArray {
  const arr =
    (Array.isArray(payload) && payload) ||
    (typeof payload === 'object' &&
      payload !== null &&
      (
        Array.isArray((payload as any).data) ? (payload as any).data :
        Array.isArray((payload as any).chats) ? (payload as any).chats :
        Array.isArray((payload as any).contacts) ? (payload as any).contacts :
        null
      ));
  if (!arr || !Array.isArray(arr)) return [];
  return arr.filter(isChatData);
}

/** Normaliza respuestas típicas de findMessages:
 * - { messages: { total, pages, currentPage, records: [...] } }
 * - { data: [...] }
 * - [ ... ]
 */
function normalizeFindMessagesPayload(payload: any) {
  // formato paginado más común
  if (payload && payload.messages && payload.messages.records && Array.isArray(payload.messages.records)) {
    const container = payload.messages;
    return {
      items: container.records as EvolutionMessage[],
      meta: {
        total: Number(container.total ?? container.count ?? 0) || undefined,
        pages: Number(container.pages ?? 0) || undefined,
        currentPage: Number(container.currentPage ?? 1) || undefined,
        nextPage:
          typeof container.currentPage === 'number' && typeof container.pages === 'number'
            ? (container.currentPage < container.pages ? container.currentPage + 1 : null)
            : undefined,
      },
    };
  }

  // variantes sin paginación explícita
  const items =
    (Array.isArray(payload) && payload) ||
    (payload && Array.isArray(payload.data) && payload.data) ||
    (payload && Array.isArray(payload.records) && payload.records) ||
    [];
  return {
    items: items as EvolutionMessage[],
    meta: {},
  };
}

/** Wrapper de fetch con body opcional */
async function doRequest(
  url: string,
  apikeyHeader: string,
  signal: AbortSignal,
  method: 'POST' | 'GET',
  bodyObj?: Record<string, any>
) {
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, */*',
      apikey: apikeyHeader,
    },
    body: method === 'POST' ? JSON.stringify(bodyObj ?? {}) : undefined,
    cache: 'no-store',
    signal,
  });
}

/* =========================
   Lógica existente (chats)
   ========================= */
export async function fetchChatsFromEvolution(
  apiKeyData: Pick<ApiKey, 'url' | 'key'>,
  instanceName: string,
  options?: {
    overrideApiKeyHeader?: string;
    timeoutMs?: number;
    allowInsecureTLS?: boolean;
    path?: 'findChats';
  }
): Promise<FetchChatsResult> {
  const { url: baseUrlRaw, key: globalApiKey } = apiKeyData;

  if (!baseUrlRaw || !globalApiKey || !instanceName) {
    return { success: false, message: 'URL / API Key / instanceName faltantes.' };
  }

  if (options?.allowInsecureTLS) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const baseURL = normalizeBaseUrl(baseUrlRaw);
  const safeInstance = encodeURIComponent(instanceName);
  const path = options?.path ?? 'findChats';
  const endpointUrl = `${baseURL}/chat/${path}/${safeInstance}`;
  const apikeyHeader = options?.overrideApiKeyHeader ?? globalApiKey;

  console.log('➡️ [fetchChatsFromEvolution] URL:', endpointUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1000, options?.timeoutMs ?? 15000));

  try {
    // 1) POST
    let response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'POST');

    // 2) fallback GET si la instancia está configurada así
    if (response.status === 404 || response.status === 405) {
      console.warn(`↪️ Reintentando con GET por status ${response.status}`);
      response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'GET');
    }

    clearTimeout(timeout);

    const ct = response.headers.get('content-type') || '';
    if (!response.ok) {
      let apiMsg = 'Error desconocido.';
      if (ct.includes('application/json')) {
        const errJson = await response.json().catch(() => null);
        apiMsg = (errJson?.message as string) || JSON.stringify(errJson) || apiMsg;
      } else {
        const errText = await response.text().catch(() => '');
        apiMsg = errText || apiMsg;
      }
      return { success: false, message: `Error en Evolution API (${response.status}): ${apiMsg}` };
    }

    const raw = ct.includes('application/json') ? await response.json().catch(() => null) : await response.text().catch(() => null);
    if (raw == null) return { success: false, message: 'La API respondió sin cuerpo o inválido.' };

    const data = ensureArrayResponse(raw);
    return { success: true, message: `OK ${path} ${instanceName}`, data };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === 'AbortError') return { success: false, message: 'Timeout de solicitud.' };
    return { success: false, message: `Error de red/interno: ${err?.message || String(err)}` };
  }
}

/* ===========================================
   Buscar mensajes por remoteJid (Find)
   POST {{baseUrl}}/chat/findMessages/{{instance}}
   =========================================== */
export async function findMessagesByRemoteJid(
  apiKeyData: Pick<ApiKey, 'url' | 'key'>,
  instanceName: string,
  remoteJid: string,
  options?: {
    overrideApiKeyHeader?: string;
    timeoutMs?: number;
    allowInsecureTLS?: boolean;
    /** filtros/paginación opcionales según tu backend Evolution */
    page?: number;
    pageSize?: number;
    limit?: number;
    fromMe?: boolean;
    includeMe?: boolean;
    search?: string;
    before?: number;
    after?: number;
  }
): Promise<FindMessagesResult & { queriedRemoteJid?: string }> {
  const { url: baseUrlRaw, key: globalApiKey } = apiKeyData;

  if (!baseUrlRaw || !globalApiKey || !instanceName || !remoteJid) {
    return { success: false, message: 'URL / API Key / instanceName / remoteJid faltantes.' };
  }

  if (options?.allowInsecureTLS) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const baseURL = normalizeBaseUrl(baseUrlRaw);
  const safeInstance = encodeURIComponent(instanceName);
  const endpointUrl = `${baseURL}/chat/findMessages/${safeInstance}`;
  const apikeyHeader = options?.overrideApiKeyHeader ?? globalApiKey;

  // Body DEFENSIVO: incluye alias frecuentes y también instanceName
  const payload: Record<string, any> = {
    instanceName,
    remoteJid,          // nombre “canónico”
    jid: remoteJid,     // alias frecuente
    chatId: remoteJid,  // otro alias visto
  };
  if (typeof options?.page === 'number') payload.page = options.page;
  if (typeof options?.pageSize === 'number') payload.pageSize = options.pageSize;
  if (typeof options?.limit === 'number') payload.limit = options.limit;
  if (typeof options?.fromMe === 'boolean') payload.fromMe = options.fromMe;
  if (typeof options?.includeMe === 'boolean') payload.includeMe = options.includeMe;
  if (typeof options?.search === 'string') payload.search = options.search;
  if (typeof options?.before === 'number') payload.before = options.before;
  if (typeof options?.after === 'number') payload.after = options.after;

  console.log('➡️ [findMessagesByRemoteJid] REQUEST', {
    method: 'POST',
    url: endpointUrl,
    headers: { 'Content-Type': 'application/json', apikey: '***redacted***' },
    body: payload,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1000, options?.timeoutMs ?? 15000));

  try {
    const response = await doRequest(endpointUrl, apikeyHeader, controller.signal, 'POST', payload);
    clearTimeout(timeout);

    const ct = response.headers.get('content-type') || '';
    const raw = ct.includes('application/json') ? await response.json().catch(() => null) : await response.text().catch(() => null);

    if (!response.ok) {
      const apiMsg =
        (raw && typeof raw === 'object' && (raw as any).message) ||
        (typeof raw === 'string' ? raw : 'Error desconocido.');
      return { success: false, message: `Error ${response.status} en findMessages: ${apiMsg}`, raw, queriedRemoteJid: remoteJid };
    }

    if (raw == null) return { success: false, message: 'La API respondió sin cuerpo o inválido.', queriedRemoteJid: remoteJid };

    const { items, meta } = normalizeFindMessagesPayload(raw);

    // Inyecta remoteJid si falta para facilitar trazas en cliente
    const normalized = (items || []).map((m: EvolutionMessage) => {
      if (!m) return m;
      const exists = (m.key && m.key.remoteJid) || (m as any).remoteJid;
      if (exists) return m;
      return {
        ...m,
        key: { ...(m.key || {}), remoteJid },
        remoteJid: (m as any).remoteJid || remoteJid,
      };
    });

    return {
      success: true,
      message: `OK findMessages ${instanceName} ${remoteJid}`,
      data: normalized,
      total: meta.total,
      pages: meta.pages,
      currentPage: meta.currentPage,
      nextPage: meta.nextPage ?? undefined,
      raw,
      queriedRemoteJid: remoteJid,
    };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === 'AbortError') return { success: false, message: 'Timeout de solicitud.', queriedRemoteJid: remoteJid };
    return { success: false, message: `Error de red/interno: ${err?.message || String(err)}`, queriedRemoteJid: remoteJid };
  }
}

// ✅ cooldown anti-spam
export const DISCONNECT_COOLDOWN_MS = 30 * 60 * 1000; // 30 min
export const EVO_FETCH_TIMEOUT_MS = 12_000; // timeout para detectar "no responde"

export type EvoHealthCacheEntry = {
  lastIsConnected: boolean | null; // null = no hay historial
  lastNotifiedAt: number;          // timestamp ms
};

export const getEvoCache = (): Map<string, EvoHealthCacheEntry> => {
  const g = globalThis as any;
  if (!g.__EVO_HEALTH_CACHE__) g.__EVO_HEALTH_CACHE__ = new Map<string, EvoHealthCacheEntry>();
  return g.__EVO_HEALTH_CACHE__ as Map<string, EvoHealthCacheEntry>;
};

// Esto representa "API reachable" (no el estado de WhatsApp)
export const isApiConnected = (responseOk: boolean) => responseOk;

/* =========================
   Tipos
========================= */
export interface GenerateQrInterface {
  instanceName: string
  userId: string
}
export interface ClientResponse<T = undefined> {
  success: boolean
  message: string
  data?: T
}
export interface WhatsAppConnectionStatus {
  qr?: {
    code: string; // Código QR en formato base64
    pairingCode: string; // Código de emparejamiento
  };
  connectionState?: {
    instance: {
      state: string; // Estado de la conexión (e.g. 'open', 'closed')
    };
  };
  success: boolean; // Indica si la conexión fue exitosa
}
export interface QRCodeResponse {
  qr?: {
    code: string; // Código QR en formato base64
    pairingCode?: string; // Código de emparejamiento (opcional)
  };
  connectionState?: {
    instance: {
      state: string; // Estado de la conexión (e.g. 'open', 'closed')
    };
  };
  evo?: {
    isConnected: boolean;               // conexión a la API
    status: "connected" | "disconnected";
    justNotified: boolean;              // para toast/banner “solo una vez”
    cooldownMs: number;
  };
  success: boolean; // Indica si la operación fue exitosa
  message?: string; // Mensaje opcional para el usuario
}

/* =========================
   Helper
========================= */
export const isWhatsappLike = (t?: string | null) => (!t || t.trim().toLowerCase() === "whatsapp");
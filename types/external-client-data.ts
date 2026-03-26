export type ExternalClientDataRecord = Record<string, unknown>;

export interface ExternalClientData {
  id: string;
  userId: string;
  remoteJid: string;
  data: ExternalClientDataRecord;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExternalClientDataImportRow {
  remoteJid: string;
  data: ExternalClientDataRecord;
}

export interface ExternalClientDataImportResult {
  created: number;
  updated: number;
  errors: number;
  parseErrors?: string[];
}

export interface GoogleSheetImportOptions {
  /** Nombre de la columna que contiene el número de WhatsApp. Por defecto: "WHATSAPP" */
  remoteJidColumn?: string;
  /** Etiqueta de origen para auditoría. Por defecto: "google_sheets" */
  source?: string;
}

export interface ExternalClientDataListResult {
  items: ExternalClientData[];
  total: number;
}

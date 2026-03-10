import type {
  Prisma,
  Registro as PrismaRegistro,
  TipoRegistro as PrismaTipoRegistro,
  Session as PrismaSession,
} from "@prisma/client";

export interface SessionsContentProps {
  userId: string;
  allTags: SimpleTag[];
}

/* ===== TAGS ===== */

export type SimpleTag = {
  id: number;
  name: string;
  slug: string;             // obligatorio para ser consistente
  color?: string | null;
};

export type FollowUpStatus =
  | "pending"
  | "processing"
  | "sent"
  | "failed"
  | "cancelled";

export type SessionFollowUpHistoryItem = {
  id: number;
  status: FollowUpStatus;
  mode: "static" | "ai";
  attempt: number;
  message: string | null;
  errorReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SessionFollowUpSummary = {
  total: number;
  active: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  cancelled: number;
  latestStatus: FollowUpStatus | null;
  latestGeneratedMessage: string | null;
  latestCreatedAt: string | null;
  recentItems: SessionFollowUpHistoryItem[];
};

/* ===== SESSION (EXTENDIENDO PRISMA) ===== */

export type Session = PrismaSession & {
  tags?: SimpleTag[];       // opcional si no siempre los cargas
  followUpSummary?: SessionFollowUpSummary | null;
};

/* ===== RESPUESTAS GENÉRICAS ===== */

export type SessionResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

// Ejemplos de alias:
export type SessionsListResponse = SessionResponse<Session[]>;
export type SingleSessionResponse = SessionResponse<Session>;
export type SessionResponseCrm = SessionResponse<SessionWithRegistrosAndTags[]>;

/* ===== TIPOS ALINEADOS A PRISMA ===== */

export type TipoRegistro = PrismaTipoRegistro;

// Sesión con registros (sin tocar todavía tags simplificados)
export type SessionWithRegistros = Session & {
  registros: PrismaRegistro[];
};

// ==== NUEVO: tipo EXACTO que devuelve Prisma con include { registros, tags: { tag } } ====

export type PrismaSessionWithRegistrosAndTags = Prisma.SessionGetPayload<{
  include: {
    registros: true;
    tags: {
      include: {
        tag: true;
      };
    };
  };
}>;

// Nuestro tipo final para el CRM:
// - Mantiene todo lo que Prisma devuelve
// - Pero transformamos "tags" a SimpleTag[]
export type SessionWithRegistrosAndTags =
  Omit<PrismaSessionWithRegistrosAndTags, "tags"> & {
    tags: SimpleTag[];
  };

// Solo defínelo así si REALMENTE incluyes la sesión
export type RegistroWithSession = PrismaRegistro & {
  session: Session;
};

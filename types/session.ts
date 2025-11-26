import type {
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

/* ===== SESSION (EXTENDIENDO PRISMA SI QUIERES) ===== */

// Si prefieres no depender de Prisma aquí, puedes dejar tu definición manual.
// Aquí te muestro cómo sería extendiendo PrismaSession:
export type Session = PrismaSession & {
  tags?: SimpleTag[];       // opcional si no siempre los cargas
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

export type SessionWithRegistros = Session & {
  registros: PrismaRegistro[];
};

export type SessionWithRegistrosAndTags = SessionWithRegistros;
// Alias por si quieres un nombre más explícito

// Solo defínelo así si REALMENTE incluyes la sesión
export type RegistroWithSession = PrismaRegistro & {
  session: Session;
};

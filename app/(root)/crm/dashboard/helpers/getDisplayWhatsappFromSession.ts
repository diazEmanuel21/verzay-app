import type {
    Session as PrismaSession,
} from "@prisma/client";

export function getDisplayWhatsappFromSession(session: PrismaSession) {
    const base = session.remoteJidAlt || session.remoteJid;
    return base.includes("@") ? base.split("@")[0] : base;
}

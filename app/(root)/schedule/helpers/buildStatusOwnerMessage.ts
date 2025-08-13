import { format, toZonedTime } from "date-fns-tz";
import { AppointmentWithSession } from './normalizeAppointmentsToEvents';

// Tipos
type AppointmentStatus = "PENDIENTE" | "CONFIRMADA" | "CANCELADA";

// Mapa de etiquetas y emojis por estado
const STATUS_META: Record<AppointmentStatus, { label: string; emoji: string }> = {
    PENDIENTE: { label: "Pendiente", emoji: "🕒" },
    CONFIRMADA: { label: "Confirmada", emoji: "✅" },
    CANCELADA: { label: "Cancelada", emoji: "❌" },
};

interface BuildStatusOwnerMessageInterface {
    appointment: AppointmentWithSession,
    newStatus: AppointmentStatus,
    opts?: { reason?: string }
}

// Genera el texto para notificar cambio de estado
export const buildStatusOwnerMessage = ({
    appointment,
    newStatus,
    opts// opcional: motivo/cancelación
}: BuildStatusOwnerMessageInterface) => {
    const prev = (appointment.status as AppointmentStatus) ?? "PENDIENTE";
    const metaPrev = STATUS_META[prev];
    const metaNew = STATUS_META[newStatus];

    // Fecha/hora en la zona horaria de la cita
    const zonedStart = toZonedTime(new Date(appointment.startTime), appointment.timezone);
    const dateLabel = format(zonedStart, "d/M/yyyy");
    const timeLabel = format(zonedStart, "h:mm a");

    // Teléfono con prefijo +
    const phonePretty = appointment.session?.remoteJid
        ? `+${appointment.session.remoteJid.replace(/^\\+/, "")}`
        : "—";

    const serviceName = appointment.service?.name ?? "—";
    const clientName = appointment.session?.pushName ?? "Cliente";

    // Si quieres que el encabezado cambie por estado:
    const headerByStatus: Record<AppointmentStatus, string> = {
        PENDIENTE: `${metaNew.emoji} Cita en estado PENDIENTE`,
        CONFIRMADA: `${metaNew.emoji} Cita CONFIRMADA`,
        CANCELADA: `${metaNew.emoji} Cita CANCELADA`,
    };

    const reasonBlock = opts?.reason ? `\n📝 Motivo: ${opts.reason}` : "";

    const text =
        `*Su cita cambió de estado*:
${headerByStatus[newStatus]}
🔁 Cambio: ${metaPrev.label} → ${metaNew.label}

👤 Nombre: ${clientName}
📝 Servicio: ${serviceName}
📅 Fecha: ${dateLabel} a las ${timeLabel} (${appointment.timezone})

WhatsApp del usuario:
👉 ${phonePretty}${reasonBlock}`;

    return text;
}

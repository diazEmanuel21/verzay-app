import { format, toZonedTime } from "date-fns-tz";
import { AppointmentWithSession } from "./normalizeAppointmentsToEvents";

// Tipos
type AppointmentStatus = "PENDIENTE" | "CONFIRMADA" | "CANCELADA";

// Mapa de título + emoji por estado (status_variable + emoji_variable)
const STATUS_META: Record<
    AppointmentStatus,
    { title: string; emoji: string }
> = {
    PENDIENTE: { title: "Cita Pendiente", emoji: "🕒" },
    CONFIRMADA: { title: "Cita Confirmada", emoji: "✅" },
    CANCELADA: { title: "Cita Cancelada", emoji: "❌" },
};

interface BuildStatusOwnerMessageInterface {
    appointment: AppointmentWithSession;
    newStatus: AppointmentStatus;
    opts?: { reason?: string };
}

// Genera el texto para notificar cambio de estado (formato compacto)
export const buildStatusOwnerMessage = ({
    appointment,
    newStatus,
    opts,
}: BuildStatusOwnerMessageInterface) => {
    const meta = STATUS_META[newStatus];

    // Fecha/hora en la zona horaria de la cita
    const zonedStart = toZonedTime(new Date(appointment.startTime), appointment.timezone);

    // Formato como tu ejemplo: 23/2/2026 y 10:00 AM
    const dateLabel = format(zonedStart, "d/M/yyyy");
    const timeLabel = format(zonedStart, "h:mm a");

    const serviceName = appointment.service?.name ?? "—";
    const clientName = appointment.session?.pushName ?? "Cliente";

    // Motivo opcional (útil en cancelación, pero funciona en cualquier estado)
    const reasonBlock = opts?.reason ? `\n\n📝 Motivo: ${opts.reason}` : "";

    const text = `📅 *${meta.title.toUpperCase()}* ${meta.emoji}

👤 *Nombre:* ${clientName}
📝 *Servicio:* ${serviceName}
📅 *Fecha:* ${dateLabel}
⌚ *Hora:* ${timeLabel} 
🌐 *Zona horaria:* (${appointment.timezone.split("/")[1]})
${reasonBlock}`;

    return text;
};
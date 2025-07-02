import { toZonedTime } from 'date-fns-tz';
import { Appointment, Service, Session } from "@prisma/client";

export interface AppointmentWithSession extends Appointment {
    session: Session;
    service: Service | null; // ← Aquí
};



export function normalizeAppointmentsToEvents(
    appointments: AppointmentWithSession[],
    timezone: string = "America/Bogota" // zona del asesor TODO: REEMPLAZAR POR CAMPO TIMEZONE DEL USER
) {
    return appointments.map((a) => {
        const localStart = toZonedTime(a.startTime, timezone);
        const localEnd = toZonedTime(a.endTime, timezone);

        return {
            id: a.id,
            title: `${a.session?.pushName || "Sin nombre"} - ${a.service?.name || "Sin servicio"}`,
            start: localStart,
            end: localEnd,
            allDay: false,
            className:
                a.status === "CONFIRMADA"
                    ? "bg-green-400 hover:bg-green-300 border-none transition-all"
                    : a.status === "CANCELADA"
                        ? "bg-red-400 hover:bg-red-300 border-none transition-all"
                        : "bg-yellow-400 hover:bg-yellow-300 border-none transition-all",
        };
    });
}

import { Appointment, Session } from "@prisma/client";

interface AppointmentWithSession extends Appointment {
    session: Session;
}

interface Event {
    title: string;
    start: string;
    end?: string;
    allDay?: boolean;
}

export function normalizeAppointmentsToEvents(appointments: AppointmentWithSession[]) {
    return appointments.map((a) => ({
        id: a.id,
        title: `${a.session?.pushName || "Sin nombre"}`,
        start: a.startTime,
        end: a.endTime,
        allDay: false,
        className:
            a.status === "CONFIRMADA"
                ? "bg-green-400 hover:bg-green-300 border-none transition-all"
                : a.status === "CANCELADA"
                    ? "bg-red-400 hover:bg-red-300 border-none transition-all"
                    : "bg-yellow-400 hover:bg-yellow-300 border-none transition-all",
    }));
}
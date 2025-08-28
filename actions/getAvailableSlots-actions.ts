'use server'

import { db } from '@/lib/db';
import { addDays, addMinutes, endOfDay, isBefore, isValid, startOfDay } from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

interface Slot {
    startTime: string; // formato ISO
    endTime: string;
}

interface AvailableSlotsResponse {
    success: boolean;
    message: string;
    data?: Slot[];
}

export async function getAvailableSlots(
    userId: string,
    date: Date,
    slotDuration = 60
): Promise<AvailableSlotsResponse> {
    if (!userId || !date) {
        return { success: false, message: 'Parámetros requeridos faltantes (userId o date).' };
    }

    try {
        // 1) TZ del dueño
        const user = await db.user.findUnique({ where: { id: userId }, select: { timezone: true } });
        const ownerTz = user?.timezone || 'America/Bogota';

        // 2) Día seleccionado / hoy en TZ del dueño (strings YYYY-MM-DD)
        const selectedDayLocal = formatInTimeZone(date, ownerTz, 'yyyy-MM-dd');
        const todayLocal = formatInTimeZone(new Date(), ownerTz, 'yyyy-MM-dd');

        // ⬅️ corte temprano: si el día seleccionado ya pasó, no hay disponibilidad
        if (selectedDayLocal < todayLocal) {
            return { success: true, message: 'El día seleccionado ya pasó.', data: [] };
        }

        // Límites del día (local dueño) → UTC
        const dayStartUtc = fromZonedTime(`${selectedDayLocal} 00:00:00`, ownerTz);
        const nextDayLocal = formatInTimeZone(addDays(date, 1), ownerTz, 'yyyy-MM-dd');
        const nextDayStartUtc = fromZonedTime(`${nextDayLocal} 00:00:00`, ownerTz);

        // Weekday en TZ del dueño
        const weekdayInOwnerTz = toZonedTime(dayStartUtc, ownerTz).getDay();

        const availability = await db.userAvailability.findMany({
            where: { userId, dayOfWeek: weekdayInOwnerTz },
            orderBy: [{ startTime: 'asc' }],
        });
        if (!availability.length) {
            return { success: true, message: 'No hay horarios disponibles para este día.', data: [] };
        }

        // 3) Citas ocupadas (consulta en UTC)
        const appointments = await db.appointment.findMany({
            where: {
                userId,
                startTime: { gte: dayStartUtc, lt: nextDayStartUtc },
                status: { in: ['PENDIENTE', 'CONFIRMADA'] },
            },
            select: { startTime: true, endTime: true },
            orderBy: { startTime: 'asc' },
        });
        const takenRanges = appointments.map(a => ({ start: a.startTime, end: a.endTime }));

        // 4) Corte “ahora” (UTC) solo si es hoy
        const isToday = selectedDayLocal === todayLocal;
        const nowUtcCutoff = isToday
            ? fromZonedTime(
                `${todayLocal} ${formatInTimeZone(new Date(), ownerTz, 'HH:mm:ss')}`,
                ownerTz
            )
            : dayStartUtc;

        // 5) Construcción de slots HH:mm (local dueño) → UTC
        const availableSlots: Slot[] = [];
        for (const range of availability) {
            const [sh, sm] = range.startTime.split(':').map(Number);
            const [eh, em] = range.endTime.split(':').map(Number);
            if ([sh, sm, eh, em].some(n => Number.isNaN(n))) continue;

            const rangeStartUtc = fromZonedTime(`${selectedDayLocal} ${range.startTime}:00`, ownerTz);
            const rangeEndUtc = fromZonedTime(`${selectedDayLocal} ${range.endTime}:00`, ownerTz);

            let cursorUtc = new Date(rangeStartUtc);
            while (cursorUtc < rangeEndUtc) {
                const slotStartUtc = new Date(cursorUtc);
                const slotEndUtc = addMinutes(slotStartUtc, slotDuration);

                const insideRange = slotEndUtc <= rangeEndUtc;
                const notTaken = !takenRanges.some(r => slotStartUtc < r.end && slotEndUtc > r.start);
                const notPast = slotStartUtc >= nowUtcCutoff; // <- oculta pasado (mantén así)

                if (insideRange && notTaken && notPast) {
                    availableSlots.push({
                        startTime: slotStartUtc.toISOString(),
                        endTime: slotEndUtc.toISOString(),
                    });
                }
                cursorUtc = addMinutes(cursorUtc, slotDuration);
            }
        }

        return { success: true, message: 'Horarios disponibles obtenidos correctamente.', data: availableSlots };
    } catch (err) {
        console.error('Error en getAvailableSlots:', err);
        return { success: false, message: 'Ocurrió un error al obtener los horarios disponibles.' };
    }
}

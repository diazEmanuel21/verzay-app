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

// export async function getAvailableSlots(
//     userId: string,
//     date: Date,
//     slotDuration = 60
// ): Promise<AvailableSlotsResponse> {
//     if (!userId || !date) {
//         return {
//             success: false,
//             message: 'Parámetros requeridos faltantes (userId o date).',
//         };
//     }
//     const parsedDate = date;

//     if (!isValid(parsedDate)) {
//         return {
//             success: false,
//             message: 'La fecha proporcionada no es válida.',
//         };
//     }

//     try {
//         const dayOfWeek = parsedDate.getDay();

//         const availability = await db.userAvailability.findMany({
//             where: { userId, dayOfWeek },
//         });

//         if (!availability.length) {
//             return {
//                 success: true,
//                 message: 'No hay horarios disponibles para este día.',
//                 data: [],
//             };
//         }

//         const startOfTargetDay = startOfDay(parsedDate);
//         const endOfTargetDay = endOfDay(parsedDate);

//         const appointments = await db.appointment.findMany({
//             where: {
//                 userId,
//                 startTime: { gte: startOfTargetDay, lte: endOfTargetDay },
//                 status: { in: ["PENDIENTE", "CONFIRMADA"] },
//             },
//         });

//         const takenRanges = appointments.map((appt) => ({
//             start: appt.startTime,
//             end: appt.endTime,
//         }));

//         const availableSlots: Slot[] = [];

//         for (const range of availability) {
//             const [startHour, startMin] = range.startTime.split(':').map(Number);
//             const [endHour, endMin] = range.endTime.split(':').map(Number);

//             if (
//                 isNaN(startHour) || isNaN(startMin) ||
//                 isNaN(endHour) || isNaN(endMin)
//             ) {
//                 console.warn('Rango de disponibilidad inválido:', range);
//                 continue;
//             }

//             let cursor = new Date(parsedDate);
//             cursor.setHours(startHour, startMin, 0, 0);

//             const endLimit = new Date(parsedDate);
//             endLimit.setHours(endHour, endMin, 0, 0);

//             while (isBefore(cursor, endLimit)) {
//                 const slotStart = new Date(cursor);
//                 const slotEnd = addMinutes(slotStart, slotDuration);

//                 // Verifica que el slot esté completamente dentro del rango disponible
//                 if (isBefore(slotEnd, endLimit) || slotEnd.getTime() === endLimit.getTime()) {
//                     // Validar que no haya conflicto con citas existentes
//                     const slotTaken = takenRanges.some(
//                         (r) =>
//                             slotStart < new Date(r.end) &&
//                             slotEnd > new Date(r.start)
//                     );

//                     if (!slotTaken) {
//                         availableSlots.push({
//                             startTime: slotStart.toISOString(),
//                             endTime: slotEnd.toISOString(),
//                         });
//                     }
//                 }

//                 cursor = addMinutes(cursor, slotDuration);
//             }
//         }

//         return {
//             success: true,
//             message: 'Horarios disponibles obtenidos correctamente.',
//             data: availableSlots,
//         };
//     } catch (error: any) {
//         console.error('Error en getAvailableSlots:', error);
//         return {
//             success: false,
//             message: 'Ocurrió un error al obtener los horarios disponibles.',
//         };
//     }
// }

export async function getAvailableSlots(
    userId: string,
    date: Date,
    slotDuration = 60
): Promise<AvailableSlotsResponse> {
    if (!userId || !date) {
        return { success: false, message: 'Parámetros requeridos faltantes (userId o date).' };
    }

    try {
        // ⬇️ 1) TZ del dueño
        const user = await db.user.findUnique({ where: { id: userId }, select: { timezone: true } });
        const ownerTz = user?.timezone || 'America/Bogota';

        // ⬇️ 2) Día seleccionado en TZ del dueño
        //    Creamos strings "locales" y los pasamos a UTC.
        const dayStartLocalStr = formatInTimeZone(startOfDay(date), ownerTz, 'yyyy-MM-dd HH:mm:ss');
        const nextDayStartLocalStr = formatInTimeZone(startOfDay(addDays(date, 1)), ownerTz, 'yyyy-MM-dd HH:mm:ss');

        const dayStartUtc = fromZonedTime(dayStartLocalStr, ownerTz);
        const nextDayStartUtc = fromZonedTime(nextDayStartLocalStr, ownerTz);

        // ⬇️ 3) Disponibilidad del día (por número de día 0..6)
        //     ¡OJO! getDay() del cliente puede no coincidir si llega con otra TZ; por eso
        //     obtenemos el weekday en la TZ del dueño:
        const weekdayInOwnerTz = toZonedTime(dayStartUtc, ownerTz).getDay();

        const availability = await db.userAvailability.findMany({
            where: { userId, dayOfWeek: weekdayInOwnerTz },
            orderBy: [{ startTime: 'asc' }],
        });

        if (!availability.length) {
            return { success: true, message: 'No hay horarios disponibles para este día.', data: [] };
        }

        // ⬇️ 4) Citas tomadas (consulta SIEMPRE en UTC)
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

        const availableSlots: Slot[] = [];

        // ⬇️ 5) Para cada rango HH:mm (local dueño) → construimos Date UTC
        for (const range of availability) {
            const [sh, sm] = range.startTime.split(':').map(Number);
            const [eh, em] = range.endTime.split(':').map(Number);
            if ([sh, sm, eh, em].some(n => Number.isNaN(n))) continue;

            // "2025-08-25 08:00:00" en TZ del dueño → UTC
            const baseLocalDayStr = formatInTimeZone(dayStartUtc, ownerTz, 'yyyy-MM-dd'); // ej: "2025-08-25"
            const rangeStartUtc = fromZonedTime(`${baseLocalDayStr} ${range.startTime}:00`, ownerTz);
            const rangeEndUtc = fromZonedTime(`${baseLocalDayStr} ${range.endTime}:00`, ownerTz);

            let cursorUtc = new Date(rangeStartUtc);
            while (cursorUtc < rangeEndUtc) {
                const slotStartUtc = new Date(cursorUtc);
                const slotEndUtc = addMinutes(slotStartUtc, slotDuration);

                if (slotEndUtc <= rangeEndUtc) {
                    // Conflicto con citas existentes (todo en UTC)
                    const taken = takenRanges.some(r => slotStartUtc < r.end && slotEndUtc > r.start);
                    if (!taken) {
                        availableSlots.push({
                            startTime: slotStartUtc.toISOString(), // ISO con Z (UTC)
                            endTime: slotEndUtc.toISOString(),
                        });
                    }
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
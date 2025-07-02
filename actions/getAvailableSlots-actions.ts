'use server'

import { db } from '@/lib/db';
import { addMinutes, endOfDay, isBefore, isValid, startOfDay } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

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
    selectedDateStr: string,
    clientTimezone: string,
    userTimeZone: string = "America/Bogota",     // zona del asesor TODO: REEMPLAZAR POR CAMPO TIMEZONE DEL USER
    slotDuration = 60
): Promise<AvailableSlotsResponse> {
    if (!userId || !selectedDateStr || !clientTimezone) {
        return {
            success: false,
            message: "Parámetros requeridos faltantes (userId o date).",
        };
    }

    // Parseamos la fecha seleccionada sin hora como base
    const parsedDate = fromZonedTime(`${selectedDateStr}T00:00:00`, userTimeZone);
    const dayOfWeek = new Date(parsedDate).getDay();

    try {
        const availability = await db.userAvailability.findMany({
            where: { userId, dayOfWeek },
        });

        if (!availability.length) {
            return {
                success: true,
                message: "No hay horarios disponibles para este día.",
                data: [],
            };
        }

        const startOfTargetDay = fromZonedTime(`${selectedDateStr}T00:00:00`, userTimeZone);
        const endOfTargetDay = fromZonedTime(`${selectedDateStr}T23:59:59`, userTimeZone);

        const appointments = await db.appointment.findMany({
            where: {
                userId,
                startTime: { gte: startOfTargetDay, lte: endOfTargetDay },
                status: { in: ["PENDIENTE", "CONFIRMADA"] },
            },
        });

        const takenRanges = appointments.map((appt) => ({
            start: new Date(appt.startTime),
            end: new Date(appt.endTime),
        }));

        const availableSlots: Slot[] = [];

        for (const range of availability) {
            const [startHour, startMin] = range.startTime.split(":").map(Number);
            const [endHour, endMin] = range.endTime.split(":").map(Number);

            if (
                isNaN(startHour) ||
                isNaN(startMin) ||
                isNaN(endHour) ||
                isNaN(endMin)
            ) {
                console.warn("Rango de disponibilidad inválido:", range);
                continue;
            }

            // Crear slotStart en zona del asesor
            let localSlot = new Date(`${selectedDateStr}T00:00:00`);
            localSlot.setHours(startHour, startMin, 0, 0);

            let slotStart = fromZonedTime(localSlot, userTimeZone);
            const localEnd = new Date(`${selectedDateStr}T00:00:00`);
            localEnd.setHours(endHour, endMin, 0, 0);
            const slotEndLimit = fromZonedTime(localEnd, userTimeZone);

            while (isBefore(slotStart, slotEndLimit)) {
                const slotEnd = addMinutes(slotStart, slotDuration);

                if (
                    isBefore(slotEnd, slotEndLimit) ||
                    slotEnd.getTime() === slotEndLimit.getTime()
                ) {
                    const slotTaken = takenRanges.some(
                        (r) => slotStart < r.end && slotEnd > r.start
                    );

                    if (!slotTaken) {
                        availableSlots.push({
                            startTime: slotStart.toISOString(),
                            endTime: slotEnd.toISOString(),
                        });
                    }
                }

                slotStart = addMinutes(slotStart, slotDuration);
            }
        }

        return {
            success: true,
            message: "Horarios disponibles obtenidos correctamente.",
            data: availableSlots,
        };
    } catch (error: any) {
        console.error("Error en getAvailableSlots:", error);
        return {
            success: false,
            message: "Ocurrió un error al obtener los horarios disponibles.",
        };
    }
}

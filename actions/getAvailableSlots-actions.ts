'use server'

import { db } from '@/lib/db';
import { format, addMinutes, isBefore, parseISO, isValid } from 'date-fns';

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
    date: string,
    slotDuration = 60
): Promise<AvailableSlotsResponse> {
    if (!userId || !date) {
        return {
            success: false,
            message: 'Parámetros requeridos faltantes (userId o date).',
        };
    }

    const parsedDate = new Date(date);
    if (!isValid(parsedDate)) {
        return {
            success: false,
            message: 'La fecha proporcionada no es válida.',
        };
    }

    try {
        const dayOfWeek = parsedDate.getDay();

        const availability = await db.userAvailability.findMany({
            where: { userId, dayOfWeek },
        });

        if (!availability.length) {
            return {
                success: true,
                message: 'No hay horarios disponibles para este día.',
                data: [],
            };
        }

        const startOfDay = new Date(`${date}T00:00:00`);
        const endOfDay = new Date(`${date}T23:59:59`);

        const appointments = await db.appointment.findMany({
            where: {
                userId,
                startTime: { gte: startOfDay, lte: endOfDay },
                status: { in: ["PENDIENTE", "CONFIRMADA"] },
            },
        });

        const takenRanges = appointments.map((appt) => ({
            start: appt.startTime,
            end: appt.endTime,
        }));

        const availableSlots: Slot[] = [];

        for (const range of availability) {
            const [startHour, startMin] = range.startTime.split(':').map(Number);
            const [endHour, endMin] = range.endTime.split(':').map(Number);

            if (
                isNaN(startHour) || isNaN(startMin) ||
                isNaN(endHour) || isNaN(endMin)
            ) {
                console.warn('Rango de disponibilidad inválido:', range);
                continue;
            }

            let cursor = new Date(parsedDate);
            cursor.setHours(startHour, startMin, 0, 0);

            const endLimit = new Date(parsedDate);
            endLimit.setHours(endHour, endMin, 0, 0);

            while (isBefore(cursor, endLimit)) {
                const slotStart = new Date(cursor);
                const slotEnd = addMinutes(slotStart, slotDuration);

                // Verifica que el slot esté completamente dentro del rango disponible
                if (isBefore(slotEnd, endLimit) || slotEnd.getTime() === endLimit.getTime()) {
                    // Validar que no haya conflicto con citas existentes
                    const slotTaken = takenRanges.some(
                        (r) =>
                            slotStart < new Date(r.end) &&
                            slotEnd > new Date(r.start)
                    );

                    if (!slotTaken) {
                        availableSlots.push({
                            startTime: slotStart.toISOString(),
                            endTime: slotEnd.toISOString(),
                        });
                    }
                }

                cursor = addMinutes(cursor, slotDuration);
            }
        }

        return {
            success: true,
            message: 'Horarios disponibles obtenidos correctamente.',
            data: availableSlots,
        };
    } catch (error: any) {
        console.error('Error en getAvailableSlots:', error);
        return {
            success: false,
            message: 'Ocurrió un error al obtener los horarios disponibles.',
        };
    }
}

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { SchedulePageClient } from "../_components";
import { Reminders } from "@prisma/client";
import { getRemindersByUserId } from "@/actions/reminders-actions";

function hasReminder(result: { data?: Reminders[] }): result is { data: Reminders[] } {
    return !!result.data
}

// Puedes precargar el asesor para mostrar info contextual
const SchedulePage = async ({ params }: { params: { userId: string } }) => {
    const user = await db.user.findUnique({
        where: { id: params.userId },
        include: {
            instancias: true,
            Service: true,
            apiKey: true,
        },
    });

    // Manejo si no se encuentra el usuario
    if (!user) return notFound();

    const resReminder = await getRemindersByUserId(user.id)
    if (!resReminder.success) {
        console.error("[REMINDERS_PAGE] Error al obtener recordatorios:", resReminder.message)
        return <strong>404</strong>
    }

    const reminders = hasReminder(resReminder) ? resReminder.data : [];

    return <SchedulePageClient
        user={user}
        reminders={reminders}
    />
};

export default SchedulePage;

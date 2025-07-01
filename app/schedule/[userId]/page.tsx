import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { SchedulePageClient } from "../_components";

// Puedes precargar el asesor para mostrar info contextual
const SchedulePage = async ({ params }: { params: { userId: string } }) => {
    const user = await db.user.findUnique({
        where: { id: params.userId },
        include: {
            instancias: true,
            Service: true 
        },
    });

    // Manejo si no se encuentra el usuario
    if (!user) return notFound();

    return <SchedulePageClient user={user} />
};

export default SchedulePage;

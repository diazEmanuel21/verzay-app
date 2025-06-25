import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { SchedulePageClient } from "../_components";

// Puedes precargar el asesor para mostrar info contextual
const SchedulePage = async ({ params }: { params: { userId: string } }) => {
    const user = await db.user.findUnique({
        where: { id: params.userId },
        select: {
            id: true,
            name: true,
            company: true,
            image: true,
            mapsUrl: true,
            lat: true,
            lng: true,
            notificationNumber: true,
            instancias: true
        },
    });

    if (!user) return notFound();
    const instanceName = user.instancias[0].instanceName;

    return (
        <div className="min-h-screen p-4 max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold">Agendar con {user.name || "nuestro asesor"}</h1>
                <p className="text-muted-foreground">{user.company}</p>
            </div>

            <SchedulePageClient userId={user.id} instanceName={instanceName}/>
        </div>
    );
};

export default SchedulePage;

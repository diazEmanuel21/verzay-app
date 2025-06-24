"use client";

import { useEffect, useState } from "react";
import { getAppointmentsByUser } from "@/actions/appointments-actions";
import { Appointment, Session } from "@prisma/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AppointmentWithSession extends Appointment {
    session: Session;
}

export default function AppointmentDashboard({ userId }: { userId: string }) {
    const [appointments, setAppointments] = useState<AppointmentWithSession[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    const loadAppointments = async () => {
        const res = await getAppointmentsByUser(userId);
        if (res.success) setAppointments((res.data || []) as AppointmentWithSession[]);
        else toast.error(res.message);
    };

    useEffect(() => {
        loadAppointments();
    }, [userId]);

    const filtered = selectedDate
        ? appointments.filter((a) => format(new Date(a.startTime), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd"))
        : appointments;

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold">Citas agendadas</h1>

            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="border rounded-md"
            />

            <div className="space-y-3">
                {filtered.length === 0 && <p className="text-muted-foreground">No hay citas para esta fecha.</p>}

                {filtered.map((a) => (
                    <div
                        key={a.id}
                        className="border rounded-md p-4 flex justify-between items-center hover:shadow-sm transition"
                    >
                        <div>
                            <div className="font-semibold">
                                {format(new Date(a.startTime), "HH:mm")} - {format(new Date(a.endTime), "HH:mm")}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {a.session?.pushName || "Sin nombre"} ({a.session?.remoteJid})
                            </div>
                        </div>

                        <Badge
                            className={cn("capitalize", {
                                "bg-yellow-200 text-yellow-900": a.status === "PENDIENTE",
                                "bg-green-200 text-green-900": a.status === "CONFIRMADA",
                                "bg-red-200 text-red-900": a.status === "CANCELADA",
                            })}
                        >
                            {a.status.toLowerCase()}
                        </Badge>
                    </div>
                ))}
            </div>
        </div>
    );
}

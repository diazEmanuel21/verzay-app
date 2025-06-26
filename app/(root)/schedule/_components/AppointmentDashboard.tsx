"use client";

import { useEffect, useState } from "react";
import { getAppointmentsByUser, updateAppointmentStatus } from "@/actions/appointments-actions";
import { Appointment, Session, AppointmentStatus } from "@prisma/client";
import { format, getHours } from "date-fns";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ScheduleSkeleton } from "./";
import { CheckCircle, XCircle } from "lucide-react";

interface AppointmentWithSession extends Appointment {
    session: Session;
}

export default function AppointmentDashboard({ userId }: { userId: string }) {
    const [appointments, setAppointments] = useState<AppointmentWithSession[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [loading, setLoading] = useState<string | null>(null);

    const loadAppointments = async () => {
        const res = await getAppointmentsByUser(userId);
        debugger;
        if (res.success) setAppointments((res.data || []) as AppointmentWithSession[]);
        else toast.error(res.message);
    };

    useEffect(() => {
        loadAppointments();
    }, [userId]);

    const handleStatusChange = async (id: string, status: AppointmentStatus) => {
        setLoading(id);
        const res = await updateAppointmentStatus(id, status);
        if (res.success) {
            toast.success("Estado actualizado");
            await loadAppointments();
        } else {
            toast.error(res.message);
        }
        setLoading(null);
    };

    const filtered = selectedDate
        ? appointments.filter((a) => format(new Date(a.startTime), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd"))
        : appointments;

    return (
        <>
            <Card className="border-border">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="border-border rounded-md"
                />
            </Card>
            <div className="space-y-3">
                {filtered.length === 0 && <ScheduleSkeleton />}

                {filtered.map((a) => (
                    <Card
                        key={a.id}
                        className="border-border rounded-md p-4 flex justify-between items-center hover:shadow-sm transition"
                    >
                        <div>
                            {/* Badge flotante arriba a la izquierda */}
                            <Badge
                                className={cn(
                                    "capitalize px-2 py-0.5 text-xs rounded-full transition-colors mb-1",
                                    {
                                        "bg-yellow-200 text-yellow-900 hover:bg-yellow-300": a.status === "PENDIENTE",
                                        "bg-green-200 text-green-900 hover:bg-green-300": a.status === "CONFIRMADA",
                                        "bg-red-200 text-red-900 hover:bg-red-300": a.status === "CANCELADA",
                                    }
                                )}
                            >
                                {a.status.toLowerCase()}
                            </Badge>
                            <div className="font-semibold flex items-center gap-2">
                                {/* Icono dinámico según la hora */}
                                <span>
                                    {getHours(new Date(a.startTime)) < 12 ? "🌞" : "🌙"}
                                </span>

                                {/* Horario en formato HH:mm */}
                                <span>
                                    {format(new Date(a.startTime), "HH:mm")} - {format(new Date(a.endTime), "HH:mm")}
                                </span>

                                {/* Fecha en formato corto */}
                                <span className="text-muted-foreground text-sm">
                                    ({format(new Date(a.startTime), "dd/MM/yyyy")})
                                </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {a.session?.pushName || "Sin nombre"} ({a.session?.remoteJid})
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Botones en stack con íconos */}
                            <div className="flex items-center gap-1">
                                {a.status !== "CONFIRMADA" && (
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        disabled={loading === a.id}
                                        onClick={() => handleStatusChange(a.id, "CONFIRMADA")}
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                    </Button>
                                )}

                                {a.status !== "CANCELADA" && (
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        disabled={loading === a.id}
                                        onClick={() => handleStatusChange(a.id, "CANCELADA")}
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </>
    );
}
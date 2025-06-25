"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { createAppointment } from "@/actions/appointments-actions";
import { getAvailableSlots } from "@/actions/getAvailableSlots-actions";

export const SchedulePageClient = ({ userId, instanceName }: { userId: string, instanceName: string }) => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    useEffect(() => {
        if (userId && selectedDate) {
            const fetchSlots = async () => {
                const res = await getAvailableSlots(userId as string, format(selectedDate, "yyyy-MM-dd"));
                debugger;
                if (res.success) setSlots(res.data || []);
                else toast.error(res.message);
            };
            fetchSlots();
        }
    }, [userId, selectedDate]);

    const handleSubmit = async () => {
        if (!name || !phone || !selectedSlot || !selectedDate) {
            toast.error("Todos los campos son obligatorios.");
            return;
        }

        const [startTime, endTime] = selectedSlot.split("|");

        setLoading(true);

        try {
            const res = await createAppointment({
                userId,
                pushName: name,
                phone,
                instanceName,
                startTime,
                endTime,
                timezone,
            });


            if (res.success) {
                toast.success("Cita agendada correctamente.");
            } else {
                toast.error(res.message);
            }
        } catch (error: any) {
            console.error("Error en agendamiento:", error);
            toast.error("Ocurrió un error al intentar agendar la cita.");
        }

        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold">Agendar cita</h1>

            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border" />

            {slots.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                    {slots.map((slot) => (
                        <button
                            key={slot.startTime}
                            onClick={() => setSelectedSlot(`${slot.startTime}|${slot.endTime}`)}
                            className={`border p-2 rounded text-sm ${selectedSlot?.startsWith(slot.startTime) ? "bg-primary" : "hover:bg-muted"}`}
                        >
                            {format(new Date(slot.startTime), "HH:mm")} - {format(new Date(slot.endTime), "HH:mm")}
                        </button>
                    ))}
                </div>
            )}

            <div className="space-y-2">
                <Input placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} />
                <Input placeholder="Número de WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full">
                {loading ? "Agendando..." : "Confirmar cita"}
            </Button>
        </div>
    );
}
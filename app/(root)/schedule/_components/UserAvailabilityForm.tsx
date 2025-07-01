"use client";

import { useEffect, useState } from "react";
import {
    createAvailability,
    getUserAvailability,
    deleteAvailability,
    updateAvailability
} from "@/actions/userAvailability-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, PlusCircle, Ban, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScheduleAvailabilitySkeleton } from "./ScheduleAvailabilitySkeleton";
import { useRouter } from "next/navigation";

const defaultTime = { startTime: "09:00", endTime: "17:00" };

const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function generateHourOptions(): string[] {
    const hours: string[] = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hour = h.toString().padStart(2, "0");
            const minute = m.toString().padStart(2, "0");
            hours.push(`${hour}:${minute}`);
        }
    }
    return hours;
}

export const UserAvailabilityForm = ({ userId }: { userId: string }) => {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [entriesByDay, setEntriesByDay] = useState<Record<number, any[]>>({});

    const loadAvailability = async () => {
        const res = await getUserAvailability(userId);
        if (res.success) {
            const data = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
            const grouped: Record<number, any[]> = {};
            for (let i = 0; i <= 6; i++) grouped[i] = [];
            data.forEach((entry) => {
                if (!grouped[entry.dayOfWeek]) grouped[entry.dayOfWeek] = [];
                grouped[entry.dayOfWeek].push(entry);
            });
            setEntriesByDay(grouped);
        } else {
            toast.error(res.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        loadAvailability();
    }, [userId]);

    const handleAdd = async (day: number) => {
        setLoading(true);
        const res = await createAvailability({
            userId,
            dayOfWeek: day,
            startTime: defaultTime.startTime,
            endTime: defaultTime.endTime,
        });
        setLoading(false);

        if (res.success) {
            toast.success("Horario añadido");
            await loadAvailability();
        } else {
            toast.error(res.message);
        }
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        const res = await deleteAvailability(id);
        if (res.success) {
            toast.success("Horario eliminado");
            await loadAvailability();
        } else {
            toast.error(res.message);
        }
    };

    const handleUpdate = async (id: string, field: "startTime" | "endTime", value: string) => {
        const entry = Object.values(entriesByDay).flat().find((e) => e.id === id);
        if (!entry) return;

        const newStart = field === "startTime" ? value : entry.startTime;
        const newEnd = field === "endTime" ? value : entry.endTime;

        const res = await updateAvailability(id, newStart, newEnd);
        if (res.success) {
            toast.success("Horario actualizado");
            await loadAvailability();
        } else {
            toast.error(res.message);
        }

        router.refresh();
    };

    return (
        <>
            {loading ? <ScheduleAvailabilitySkeleton /> : <div className="space-y-4">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-24 font-medium">{dayLabels[i]}</div>
                        {entriesByDay[i]?.length > 0 ? (
                            <div className="flex flex-col gap-1">
                                {entriesByDay[i].map((entry) => (
                                    <Card key={entry.id} className="flex justify-between items-center border-none gap-2">
                                        <div className="flex items-center gap-2">
                                            <Select defaultValue={entry.startTime} onValueChange={(val) => handleUpdate(entry.id, "startTime", val)}>
                                                <SelectTrigger className="w-24">
                                                    <SelectValue placeholder="Inicio" />
                                                </SelectTrigger>
                                                <SelectContent className="border-border">
                                                    {generateHourOptions().map((hour) => (
                                                        <SelectItem key={hour} value={hour} defaultValue={entry.startTime}>
                                                            {hour}
                                                        </SelectItem>
                                                    )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <span>–</span>
                                            <Select defaultValue={entry.endTime} onValueChange={(val) => handleUpdate(entry.id, "endTime", val)}>
                                                <SelectTrigger className="w-24">
                                                    <SelectValue placeholder="Fin" />
                                                </SelectTrigger>
                                                <SelectContent className="border-border">
                                                    {generateHourOptions().map((hour) => (
                                                        <SelectItem key={hour} value={hour} defaultValue={entry.endTime}>
                                                            {hour}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button variant="destructive" size="icon" onClick={() => handleDelete(entry.id)}>
                                            <Trash2 />
                                        </Button>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <>
                                <span className="text-muted-foreground">No disponible</span>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleAdd(i)}
                                >
                                    <PlusCircle className="w-4 h-4" />
                                </Button>

                            </>
                        )}
                    </div>
                ))}
            </div>
            }
        </>
    );
};
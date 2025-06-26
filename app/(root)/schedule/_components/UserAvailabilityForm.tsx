"use client";

import { useEffect, useState } from "react";
import { createAvailability, getUserAvailability, deleteAvailability } from "@/actions/userAvailability-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { ScheduleAvailabilitySkeleton } from "./ScheduleAvailabilitySkeleton";

const daysOfWeek = [
    { label: "Lunes", value: "1" },
    { label: "Martes", value: "2" },
    { label: "Miércoles", value: "3" },
    { label: "Jueves", value: "4" },
    { label: "Viernes", value: "5" },
    { label: "Sábado", value: "6" },
    { label: "Domingo", value: "0" },
];

export const UserAvailabilityForm = ({ userId }: { userId: string }) => {
    const [day, setDay] = useState("1");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [loading, setLoading] = useState(false);
    const [entries, setEntries] = useState<any[]>([]);

    const loadAvailability = async () => {
        const res = await getUserAvailability(userId);
        if (res.success) {
            const data = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
            setEntries(data);
        } else {
            toast.error(res.message);
        }
        setLoading(false);
    }

    useEffect(() => {
        setLoading(true);
        loadAvailability();
    }, [userId]);

    const handleAdd = async () => {
        if (!startTime || !endTime || !day) {
            toast.error("Todos los campos son obligatorios.");
            return;
        }

        setLoading(true);
        const res = await createAvailability({
            userId,
            dayOfWeek: parseInt(day),
            startTime,
            endTime,
        });
        setLoading(false);

        if (res.success) {
            toast.success(res.message);
            setStartTime("");
            setEndTime("");
            await loadAvailability();
        } else {
            toast.error(res.message);
        }
    };

    const handleDelete = async (id: string) => {
        const res = await deleteAvailability(id);
        if (res.success) {
            toast.success(res.message);
            await loadAvailability();
        } else {
            toast.error(res.message);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Select value={day} onValueChange={setDay}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Día" />
                    </SelectTrigger>
                    <SelectContent>
                        {daysOfWeek.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                                {d.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-32"
                />
                <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-32"
                />
                <Button onClick={handleAdd} disabled={loading}>
                    Agregar
                </Button>
            </div>

            {loading && <ScheduleAvailabilitySkeleton />}

            {entries.map((entry) => (
                <Card key={entry.id} className="flex justify-between items-center border-border rounded px-3 py-1 text-sm">
                    <span>
                        {daysOfWeek.find((d) => d.value === String(entry.dayOfWeek))?.label} - {entry.startTime} a {entry.endTime}
                    </span>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(entry.id)}>
                        <Trash2 />
                    </Button>
                </Card>
            ))}
        </div>
    );
}

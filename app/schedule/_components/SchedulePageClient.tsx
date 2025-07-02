"use client";

import { useEffect, useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogHeader, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { format, isBefore, startOfDay } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { createAppointment } from "@/actions/appointments-actions";
import { getAvailableSlots } from "@/actions/getAvailableSlots-actions";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ScheduleInterface } from "@/schema/schema";
import Image from "next/image";

export const SchedulePageClient = ({ user }: ScheduleInterface) => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState("");
    const [openDialog, setOpenDialog] = useState(false);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const appointmentHour = 1;
    const instanceName = user.instancias[0]?.instanceName ?? "";

    useEffect(() => {
        if (user.id && selectedDate) {
            const fetchSlots = async () => {

                const selectedDateOnly = format(selectedDate, 'yyyy-MM-dd'); // "2025-07-02"
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                // const res = await getAvailableSlots(user.id, selectedDate);
                const res = await getAvailableSlots(user.id, selectedDateOnly, timezone);

                if (res.success) setSlots(res.data || []);
                else toast.error(res.message);
            };
            fetchSlots();
        }
    }, [user.id, selectedDate]);

    const handleConfirmAppointment = async () => {
        if (!name || !phone || !selectedSlot || !selectedDate || !selectedService) {
            toast.error("Todos los campos son obligatorios.");
            return;
        }

        const [startTime, endTime] = selectedSlot.split("|");

        setLoading(true);

        try {
            const res = await createAppointment({
                userId: user.id,
                pushName: name,
                phone,
                instanceName,
                startTime,
                endTime,
                timezone,
                serviceId: selectedService, // Se envía el servicio seleccionado
            });


            if (res.success) {
                toast.success("Cita agendada correctamente.");
                resetForm();
            } else {
                toast.error(res.message);
            }
        } catch (error: any) {
            console.error("Error en agendamiento:", error);
            toast.error("Ocurrió un error al intentar agendar la cita.");
        }

        setLoading(false);
    };

    const resetForm = () => {
        setSelectedDate(undefined);
        setSlots([]);
        setSelectedSlot(null);
        setOpenDialog(false);
        setSelectedService("")
        setName("");
        setPhone("");
        setLoading(false);
    };

    const handlePreview = () => {
        if (!name || !phone || !selectedSlot || !selectedDate) {
            toast.error("Todos los campos son obligatorios.");
            return;
        }

        setOpenDialog(true); // Abre el resumen
    };

    return (
        <>

            <div className="flex flex-col gap-2 w-full px-4 max-w-96">
                <div className="flex flex-row gap-2 mb-2">
                    <Image
                        src={user.image ?? "/assets/image/logo_app.png"}
                        alt="IA Agent Logo"
                        width={80}
                        height={80}
                        className="mx-auto rounded-full border border-border shadow object-cover"
                    />
                    <div className="flex flex-1 justify-between flex-col">
                        <Select value={selectedService} onValueChange={setSelectedService}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecciona un servicio" />
                            </SelectTrigger>
                            <SelectContent>
                                {user.Service.map((service) => (
                                    <SelectItem key={service.id} value={service.id}>
                                        {service.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <p className="text-sm text-muted-foreground">
                            Agendar con <span className="font-bold">{user.name || "nuestro asesor"}</span>
                        </p>

                        <p className="text-sm text-muted-foreground">
                            Duración: {appointmentHour} hrs
                        </p>
                    </div>
                </div>


                <ScrollArea className="flex w-full max-w-2xl h-[50vh] p-4 rounded-md shadow-md overflow-auto gap-2 flex-col items-center">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border-border"
                        disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
                    />

                    {slots.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                            {slots.map((slot) => {
                                return (
                                    <Button
                                        variant={`${selectedSlot?.startsWith(slot.startTime) ? "default" : "outline"}`}
                                        key={slot.startTime}
                                        onClick={() => setSelectedSlot(`${slot.startTime}|${slot.endTime}`)}
                                    >
                                        {format(new Date(slot.startTime), "HH:mm")} - {format(new Date(slot.endTime), "HH:mm")}
                                    </Button>
                                )
                            })}
                        </div>
                    )}


                </ScrollArea>

                {
                    slots.length > 0 &&
                    <div className="flex flex-col gap-2 w-full">
                        <div className="space-y-2">
                            <Input placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} />
                            <Input placeholder="Número de WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>

                        <Button onClick={handlePreview} disabled={loading} className="w-full">
                            {loading ? "Agendando..." : "Confirmar cita"}
                        </Button>
                    </div>
                }
            </div>

            {
                selectedDate &&
                <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
                    <AlertDialogContent className="border-border">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar cita</AlertDialogTitle>
                            <AlertDialogDescription>
                                Estás a punto de agendar una cita con los siguientes datos:
                                <ul className="mt-4 text-sm space-y-1">
                                    <li><strong>Motivo:</strong> {user.Service.find(s => s.id === selectedService)?.name}</li>
                                    <li><strong>Nombre:</strong> {name}</li>
                                    <li><strong>Teléfono:</strong> {phone}</li>
                                    <li><strong>Fecha:</strong> {format(selectedDate, "PPP")}</li>
                                    <li>
                                        <strong>Horario:</strong>{" "}
                                        {selectedSlot && (() => {
                                            const [start, end] = selectedSlot.split("|");
                                            return `${format(new Date(start), "HH:mm")} - ${format(new Date(end), "HH:mm")}`;
                                        })()}
                                    </li>
                                </ul>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmAppointment} disabled={loading}>
                                {loading ? "Agendando..." : "Confirmar"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            }
        </>
    );
}
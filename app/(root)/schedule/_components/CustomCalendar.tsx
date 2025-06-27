"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { toast } from "sonner";

import { getAppointmentsByUser, updateAppointmentStatus } from "@/actions/appointments-actions";
import { Appointment, AppointmentStatus, Session } from "@prisma/client";
import { normalizeAppointmentsToEvents } from "../helpers";
import { CalendarSkeleton } from './CalendarSkeleton';

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

interface AppointmentWithSession extends Appointment {
    session: Session;
}

export const CustomCalendar = ({ userId }: { userId: string }) => {
    const toastId = "progress-calendar";

    const [appointments, setAppointments] = useState<AppointmentWithSession[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [newStatus, setNewStatus] = useState<AppointmentStatus>("CONFIRMADA");

    const loadAppointments = async () => {
        const res = await getAppointmentsByUser(userId);
        if (res.success) {
            setAppointments((res.data || []) as AppointmentWithSession[]);
            toast.success("Agenda cargada con éxito ✅", { id: toastId });
        } else {
            toast.error(res.message, { id: toastId });
        }
    };

    useEffect(() => {
        toast.loading("🔄 Cargando su agenda, un momento por favor...", {
            id: toastId,
        });
        loadAppointments();
    }, [userId]);

    const handleStatusChange = async (id: string, status: AppointmentStatus) => {
        toast.loading("🔃 Actualizando el estado de la cita...", { id: toastId });

        const res = await updateAppointmentStatus(id, status);
        if (res.success) {
            toast.success("📌 Estado actualizado correctamente", { id: toastId });
            await loadAppointments();
        } else {
            toast.error(res.message, { id: toastId });
        }
    };

    const events = normalizeAppointmentsToEvents(appointments);

    const selectedAppointment = appointments.find((a) => a.id === selectedEventId);

    return (
        <>
            <FullCalendar plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}

                initialView="timeGridWeek"
                events={events}
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                editable={true}
                height="auto"
                eventClick={(info) => {
                    setSelectedEventId(info.event.id);
                    const currentStatus = appointments.find((a) => a.id === info.event.id)?.status;
                    setNewStatus(currentStatus || "PENDIENTE");
                    setOpenDialog(true);
                }}
            />
            
            <AlertDialog
                open={openDialog}
                onOpenChange={(open) => {
                    setOpenDialog(open);
                    if (!open) {
                        setSelectedEventId(null);
                        setNewStatus("CONFIRMADA");
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Actualizar estado</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás por modificar el estado de la cita:
                            <br />
                            <span className="text-muted-foreground">
                                {selectedAppointment?.session?.pushName || "Cliente desconocido"}
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <Select
                        value={newStatus}
                        onValueChange={(val) => setNewStatus(val as AppointmentStatus)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PENDIENTE">🕒 Pendiente</SelectItem>
                            <SelectItem value="CONFIRMADA">✅ Confirmada</SelectItem>
                            <SelectItem value="CANCELADA">❌ Cancelada</SelectItem>
                        </SelectContent>
                    </Select>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (selectedEventId) {
                                    handleStatusChange(selectedEventId, newStatus);
                                    setOpenDialog(false);
                                }
                            }}
                        >
                            Actualizar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

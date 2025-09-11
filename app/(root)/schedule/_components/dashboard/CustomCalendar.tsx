"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { toast } from "sonner";

import { getAppointmentsByUser, updateAppointmentStatus } from "@/actions/appointments-actions";
import { AppointmentStatus, User } from "@prisma/client";
import { AppointmentWithSession, buildStatusOwnerMessage, normalizeAppointmentsToEvents } from "../../helpers";


import esLocale from '@fullcalendar/core/locales/es';

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
} from "@/components/ui/alert-dialog";

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { ScheduleInterface } from "@/schema/schema";
import { XCircleIcon } from 'lucide-react';
import { sendingMessages } from "@/actions/sending-messages-actions";

export const CustomCalendar = ({ user }: ScheduleInterface) => {
    const toastId = "progress-calendar";

    const [appointments, setAppointments] = useState<AppointmentWithSession[]>([]);
    const [currentAppointment, setCurrentAppointment] = useState<AppointmentWithSession>();
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [newStatus, setNewStatus] = useState<AppointmentStatus>("CONFIRMADA");

    const loadAppointments = async () => {
        const res = await getAppointmentsByUser(user.id);
        if (res.success) {
            setAppointments((res.data || []) as AppointmentWithSession[]);
            toast.success("Agenda cargada con éxito", { id: toastId });
        } else {
            toast.error(res.message, { id: toastId });
        }
    };

    useEffect(() => {
        toast.loading("Cargando su agenda, un momento por favor...", {
            id: toastId,
        });
        loadAppointments();
    }, [user.id]);

    const handleStatusChange = async (id: string, status: AppointmentStatus) => {
        toast.loading("Actualizando el estado de la cita...", { id: toastId });

        const res = await updateAppointmentStatus(id, status);
        if (res.success) {
            toast.success("📌 Estado actualizado correctamente", { id: toastId });

            await notifyChangeStatus();
            await loadAppointments();
        } else {
            toast.error(res.message, { id: toastId });
        }
    };

    const events = normalizeAppointmentsToEvents(appointments);
    const selectedAppointment = appointments.find((a) => a.id === selectedEventId);


    const notifyChangeStatus = async () => {
        if (!user.apiKey || !user.instancias || !currentAppointment) return toast.info('Campos incompletos o vacios');

        const urlevo = user.apiKey?.url;
        const apikey = user.instancias[0].instanceId;
        const instanceName = user.instancias[0]?.instanceName ?? "";

        const url = `https://${urlevo}/message/sendText/${instanceName}`;
        const text = buildStatusOwnerMessage({
            appointment: currentAppointment,
            newStatus /*, { reason: 'Cliente no puede asistir' }*/
        });

        const remoteJid = currentAppointment.session.remoteJid.split('@')[0];

        try {
            const result = await sendingMessages({ url, apikey, remoteJid, text });

            if (result.success) {
                toast.success(result.message);
            } else {
                toast.warning(`No se pudo enviar el mensaje: ${result.message}`);
            }

        } catch (error) {
            console.error("Error en notificación:", error);
            toast.error("currió un error al intentar notificar la cita.");
        }
    };


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
                    setCurrentAppointment(appointments.find((a) => a.id === info.event.id))
                    setNewStatus(currentStatus || "PENDIENTE");
                    setOpenDialog(true);
                }}
                locale={esLocale}
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
                <AlertDialogContent className="border-border">
                    <AlertDialogHeader className="flex items-end">
                        <Button variant={"ghost"} onClick={() => setOpenDialog(false)}><XCircleIcon /></Button>
                    </AlertDialogHeader>
                    <Tabs defaultValue="status">
                        <TabsList>
                            <TabsTrigger value="status">Estado</TabsTrigger>
                        </TabsList>
                        <TabsContent value="status">
                            <Card className="border-border">
                                <CardHeader>
                                    {/* <CardTitle>Estado</CardTitle> */}
                                    <CardDescription>
                                        Estás por modificar el estado de la cita:
                                        <br />
                                        <span className="text-muted-foreground">
                                            {selectedAppointment?.session?.pushName || "Cliente desconocido"}
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Select
                                        value={newStatus}
                                        onValueChange={(val) => setNewStatus(val as AppointmentStatus)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                                            <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
                                            <SelectItem value="CANCELADA">Cancelada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                                <CardFooter className="flex gap-2 flex-row">
                                    <Button variant={'outline'}>Cancelar</Button>

                                    <Button
                                        onClick={() => {
                                            if (selectedEventId) {
                                                handleStatusChange(selectedEventId, newStatus);
                                                setOpenDialog(false);
                                            }
                                        }}
                                    >
                                        Actualizar
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { toast } from "sonner";

import { getAppointmentsByUser, updateAppointmentStatus } from "@/actions/appointments-actions";
import { AppointmentStatus, User } from "@prisma/client";
import { AppointmentWithSession, normalizeAppointmentsToEvents } from "../helpers";
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
import { ReminderForm } from "../../reminders/_components";
import { ScheduleInterface } from "@/schema/schema";
import { useReminderDialogStore } from "@/stores";
import { XCircleIcon } from 'lucide-react';

export const CustomCalendar = ({ user }: ScheduleInterface) => {
    const { reminderData } = useReminderDialogStore();
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
            await loadAppointments();
        } else {
            toast.error(res.message, { id: toastId });
        }
    };

    const events = normalizeAppointmentsToEvents(appointments);
    const selectedAppointment = appointments.find((a) => a.id === selectedEventId);

    const transformedReminder = {
        title: reminderData?.title || '',
        time: reminderData?.time || '',
        repeatType: "NONE",
        instanceName: user.instancias[0].instanceName || '',
        pushName: currentAppointment?.session.pushName || '',
        remoteJid: currentAppointment?.session.remoteJid || '',
        serverUrl: user.apiKey?.url || '',
        apikey: user.apiKey?.key || '',
        userId: user.id || '',
        workflowId: reminderData?.workflowId || '',
        description: reminderData?.description || '',
        repeatEvery: undefined,
        isSchedule: true,
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
                    <Tabs defaultValue="reminder">
                        <TabsList>
                            <TabsTrigger value="reminder">Recordatorios</TabsTrigger>
                            <TabsTrigger value="status">Estado</TabsTrigger>
                        </TabsList>
                        <TabsContent value="reminder">
                            <Card className="border-border pt-3">
                                <CardContent>
                                    <ReminderForm
                                        isSchedule={true}
                                        apikey={user?.apiKeyId ?? ""}
                                        instanceNameReminder={user.instancias[0].instanceName}
                                        serverUrl={user.apiKey?.url ?? ''}
                                        userId={user.id}
                                        initialData={transformedReminder}
                                        dateSchedule={currentAppointment?.startTime.toString()}
                                        instanceId={user.instancias[0].instanceId}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="status">
                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle>Estado</CardTitle>
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
                                            <SelectItem value="PENDIENTE">🕒 Pendiente</SelectItem>
                                            <SelectItem value="CONFIRMADA">✅ Confirmada</SelectItem>
                                            <SelectItem value="CANCELADA">❌ Cancelada</SelectItem>
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
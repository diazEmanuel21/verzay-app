"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { format, isBefore, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogHeader, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScheduleInterface } from "@/schema/schema";
import { SeguimientoInput } from "@/schema/seguimientos";
import { createAppointment } from "@/actions/appointments-actions";
import { sendMessageWithHistoryAction } from "@/actions/chat-history/send-message-with-history-action";
import { getAvailableSlots } from "@/actions/getAvailableSlots-actions";
import { createSeguimiento } from "@/actions/seguimientos-actions";
import { formatDateLabel, formatServiceMessage, normalizeTimeToSeconds, normalizeToE164, subtractSecondsFromTime, toRemoteJid } from "../helpers";

import { CalendarIcon, CheckCircle2, Clock, ScrollText, User2 } from "lucide-react";
import { es } from "date-fns/locale";
import { DateHourComponent, ScheduleForm, ServiceComponent, SummaryComponent } from "./steps";
import { SummaryItem } from "./";
import { SERVER_TIME_ZONE } from "@/types/schedule";

export const SchedulePageClient = ({ user, reminders, countries }: ScheduleInterface) => {
    // ── UI Steeps
    const [step, setStep] = useState(0);
    const stepLabel = [
        { label: "Servicio", icon: <Clock className="h-4 w-4" /> },
        { label: "Fecha y hora", icon: <CalendarIcon className="h-4 w-4" /> },
        // { label: "Encargado", icon: <User2 className="h-4 w-4" /> },
        { label: "Tus datos", icon: <ScrollText className="h-4 w-4" /> },
        { label: "Revisión", icon: <CheckCircle2 className="h-4 w-4" /> },
    ];

    // ── Datos existentes en tu flujo
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const slotDuration = !user.meetingDuration ? 60 : user.meetingDuration;
    const instanceName = user.instancias[0]?.instanceName ?? "";

    // ── Selecciones
    const [selectedService, setSelectedService] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedDateYmd, setSelectedDateYmd] = useState<string>("");
    const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    const [nameClient, setNameClient] = useState("");
    const [areaCode, setAreaCode] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const canContinueStep2 = Boolean(nameClient.trim() && phone.trim() && areaCode && selectedService);

    // ── Seguimientos
    const mutationSeguimiento = useMutation({
        mutationFn: async (data: SeguimientoInput) => await createSeguimiento(data),
        onSuccess: (res) => {
            if (!res.success) toast.error(res.message);
        },
        onError: () => {
            toast.error("Error inesperado al crear seguimiento");
        },
    });

    // ── Carga de slots al elegir fecha
    useEffect(() => {
        if (!user.id || !selectedDateYmd) return;
        (async () => {
            const res = await getAvailableSlots(user.id as string, selectedDateYmd, slotDuration, SERVER_TIME_ZONE);
            if (res.success) setSlots(res.data || []);
            else toast.error(res.message);
        })();
    }, [user.id, selectedDateYmd, slotDuration]);

    // ── Confirmación + notificación (con envío al owner)
    const handleConfirmAppointment = async () => {
        if (!nameClient || !phone || !selectedSlot || !selectedDate || !selectedService || !areaCode) {
            toast.error("Todos los campos son obligatorios.");
            return;
        }
        if (!reminders) return toast.error("missing reminders");

        const [startTime, endTime] = selectedSlot.split("|");
        const e164 = normalizeToE164(areaCode, phone);
        if (!e164) {
            toast.error("Número de WhatsApp inválido. Verifica el país y el número.");
            setLoading(false);
            return;
        }
        const remoteJid = toRemoteJid(e164);

        setLoading(true);

        try {
            const res = await createAppointment({
                userId: user.id,
                pushName: nameClient,
                phone: remoteJid,
                instanceName,
                startTime,
                endTime,
                timezone,
                serviceId: selectedService,
            });

            if (!res.success) {
                toast.error(res.message);
                setLoading(false);
                return;
            }

            // Seguimientos (como ya lo tienes)
            const secondsReminders = reminders.map((rem) => ({
                ...rem,
                normalizedSeconds: isNaN(normalizeTimeToSeconds(rem?.time ?? "")) ? 0 : normalizeTimeToSeconds(rem?.time ?? ""),
            }));

            /* Utiliza sendingMessages posterior a la generación de reminders */
            secondsReminders.forEach((rem) => {
                if (!rem.normalizedSeconds) return;
                // const startLocal = toZonedTime(new Date(startTime), timezone);
                const startLocal = toZonedTime(new Date(startTime), SERVER_TIME_ZONE);
                const seguimientoTime = subtractSecondsFromTime(startLocal, rem.normalizedSeconds);
                const dataSeguimiento: SeguimientoInput = {
                    idNodo: "",
                    serverurl: `https://${user.apiKey?.url}`,
                    instancia: user.instancias[0].instanceName,
                    apikey: user.instancias[0].instanceId,
                    remoteJid,
                    mensaje: formatServiceMessage(rem.description ?? '', {
                        nameClient,
                        selectedDate,
                        selectedSlot,
                        timezone,
                        slotDuration,
                    }),
                    tipo: "text",
                    time: seguimientoTime,
                    name_file: undefined,
                    consecutivo: undefined,
                    media: undefined,
                };
                mutationSeguimiento.mutate(dataSeguimiento);
            });

            // ─────────────────────────────────────────────
            // 📩 Enviar mensaje al owner (dueño de la app)
            // ─────────────────────────────────────────────
            if (user.apiKey && user.instancias?.[0] && user.notificationNumber) {
                const urlevo = user.apiKey.url;
                const apikey = user.instancias[0].instanceId;

                const url = `https://${urlevo}/message/sendText/${instanceName}`;

                // Asegura el sufijo del JID del owner
                const ownerJid = user.notificationNumber.includes("@s.whatsapp.net")
                    ? user.notificationNumber
                    : `${user.notificationNumber}@s.whatsapp.net`;

                // Datos de fecha/hora legibles en la TZ de la cita - antes era timezone ahora serverTimeZone
                const startLocal = toZonedTime(new Date(startTime), SERVER_TIME_ZONE);
                // const dateLabel = format(selectedDate!, "PPP");
                const dateLabel = format(selectedDate!, "d 'de' MMMM 'de' yyyy", { locale: es });

                const hourLabel = format(startLocal, "hh:mm a");

                const serviceName = user.services.find((s) => s.id === selectedService)?.name ?? "Asesoría";
                // const displayPhone = `+${fullPhone}`;
                const displayPhone = e164;

                const ownerText = ` *Tienes Nueva Cita*:

👤 *Nombre*: ${nameClient}
📝 *Descripción ${serviceName}*: Para el día ${dateLabel} a las ${hourLabel}.

*WhatsApp del usuario*:

👉 ${displayPhone}`;

                try {
                    const ownerRes = await sendMessageWithHistoryAction({
                        instanceName,
                        url,
                        apikey,
                        remoteJid: ownerJid,
                        message: ownerText,
                        historyType: 'notification',
                        additionalKwargs: {
                            source: 'SchedulePageClient',
                            recipient: 'owner',
                            appointmentUserId: user.id,
                        },
                    });
                    if (!ownerRes.success) {
                        toast.warning(`No se pudo notificar al dueño: ${ownerRes.message}`);
                    }
                } catch (e) {
                    console.error("Error notificando al owner:", e);
                    toast.warning("No se pudo enviar la notificación al dueño.");
                }
            }
            // ─────────────────────────────────────────────

            toast.success("Cita agendada correctamente.");
            resetForm();
        } catch (err) {
            console.error("Error en agendamiento:", err);
            toast.error("Ocurrió un error al intentar agendar la cita.");
        }

        setLoading(false);
    };

    const scheduleAndNotify = async () => {
        if (!user.apiKey || !user.instancias) return toast.info("Campos incompletos o vacíos");
        if (!selectedService) return toast.info("Debes seleccionar un servicio");

        const urlevo = user.apiKey?.url;
        const apikey = user.instancias[0].instanceId;
        const url = `https://${urlevo}/message/sendText/${instanceName}`;
        const currentService = user.services.find((s) => s.id === selectedService);
        const text = formatServiceMessage(currentService?.messageText, {
            nameClient,
            selectedDate,
            selectedSlot,
            timezone,
            slotDuration,
        });
        const e164 = normalizeToE164(areaCode, phone);
        if (!e164) {
            toast.error("Número de WhatsApp inválido. Verifica el país y el número.");
            return;
        }
        const remoteJid = toRemoteJid(e164);

        try {
            await handleConfirmAppointment();
            const result = await sendMessageWithHistoryAction({
                instanceName,
                url,
                apikey,
                remoteJid,
                message: text,
                historyType: 'notification',
                additionalKwargs: {
                    source: 'SchedulePageClient',
                    recipient: 'client',
                    serviceId: selectedService,
                },
            });
            if (result.success) toast.success(result.message);
            else {
                toast.info(`No se envió el mensaje de notificación`);
                console.error(`Error SchedulePageClient line: 232 ${result.message}`)
            }
        } catch (error) {
            console.error("Error en notificación:", error);
            toast.error("Ocurrió un error al intentar notificar la cita.");
        }
    };

    const resetForm = () => {
        setStep(0);
        setSelectedService("");
        setSelectedDate(undefined);
        setSlots([]);
        setSelectedSlot(null);
        setNameClient("");
        setAreaCode("");
        setPhone("");
        setLoading(false);
        setOpenDialog(false);
    };

    return (
        <>
            <div className="w-full min-h-[100vh] p-4 overflow-auto">
                {/* <Button onClick={() => testAPISendMessages()}>Probar API</Button> */}
                <div className="flex justify-center max-h-[86vh] w-full overflow-auto">
                    {/* Columna izquierda: content por pasos */}
                    <div className="space-y-2 w-full md:max-w-[700px]">
                        {/* Stepper */}
                        <Card className="border-muted/50">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-wrap justify-between gap-2">
                                    {stepLabel.map((s, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div
                                                className={`h-8 w-8 rounded-full grid place-items-center text-sm shadow ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                                    }`}
                                            >
                                                {s.icon}
                                            </div>
                                            <span className={`hidden sm:block text-sm ${i === step ? "font-semibold" : "text-muted-foreground"}`}>
                                                {s.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Encabezado con logo + servicio */}
                        <Card className="border-muted/50">
                            <CardContent className="flex items-center gap-3 p-4">
                                <Image
                                    src={user.image ?? "/assets/image/logo_app.png"}
                                    alt="IA Agent Logo"
                                    width={56}
                                    height={56}
                                    className="rounded-full border border-border shadow object-cover"
                                />
                                <div className="flex-1">
                                    <div className="text-sm text-muted-foreground">
                                        Agendar con <span className="font-semibold">{user.company || "nuestro asesor"}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">Duración: {slotDuration} min</div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Paso 0: Servicio */}
                        {step === 0 && (
                            <ServiceComponent
                                selectedService={selectedService}
                                setStep={setStep}
                                setSelectedService={setSelectedService}
                                user={user}
                            />
                        )}

                        {/* Paso 1: Fecha y hora */}
                        {step === 1 && (
                            <DateHourComponent
                                setSelectedDate={setSelectedDate}
                                setSelectedSlot={setSelectedSlot}
                                setSelectedDateYmd={setSelectedDateYmd}
                                setStep={setStep}
                                selectedService={selectedService}
                                selectedSlot={selectedSlot}
                                setSlots={setSlots}
                                timezone={timezone}
                                serverTimeZone={SERVER_TIME_ZONE}
                                slots={slots}
                                selectedDate={selectedDate}
                                slotDuration={slotDuration}
                                user={user}
                                phone={phone}
                                areaCode={areaCode}
                                nameClient={nameClient}
                            />
                        )}

                        {/* Paso 2: Seleccion de empleado */}
                        {/* {step === 2 && (
                            <EmployeesComponent
                            />
                        )} */}

                        {/* Paso 3: Revisión */}
                        {step === 2 && (
                            <ScheduleForm
                                nameClient={nameClient}
                                countries={countries}
                                areaCode={areaCode}
                                phone={phone}
                                canContinueStep2={canContinueStep2}
                                setNameClient={setNameClient}
                                setAreaCode={setAreaCode}
                                setPhone={setPhone}
                                setStep={setStep}
                            />
                        )}

                        {/* Paso 4: Revisión */}
                        {step === 3 && (
                            <SummaryComponent
                                user={user}
                                timezone={timezone}
                                nameClient={nameClient}
                                areaCode={areaCode}
                                phone={phone}
                                loading={loading}
                                selectedService={selectedService}
                                selectedSlot={selectedSlot}
                                selectedDate={selectedDate}
                                setStep={setStep}
                                setOpenDialog={setOpenDialog}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmación final (reutilizo tu AlertDialog) */}
            {selectedDate && (
                <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
                    <AlertDialogContent className="border-border">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar cita</AlertDialogTitle>
                            <AlertDialogDescription>
                                Estás a punto de agendar una cita con los siguientes datos:
                                <Card className="border-none mt-2 ">
                                    <CardContent className="space-y-4 p-0 m-0">
                                        <SummaryItem label="Servicio" value={user.services.find((s) => s.id === selectedService)?.name ?? "—"} />
                                        <SummaryItem label="Duración" value={`${slotDuration} min`} />
                                        <SummaryItem label="Fecha" value={formatDateLabel(selectedDate)} />
                                        <SummaryItem label="Contacto" value={`${areaCode} ${phone}`} />
                                        <SummaryItem
                                            label="Hora"
                                            value={
                                                selectedSlot
                                                    ? format(toZonedTime(new Date(selectedSlot.split("|")[0]), timezone), "hh:mm a")
                                                    : "—"
                                            }
                                        />
                                        <SummaryItem label="Zona horaria" value={timezone} />
                                    </CardContent>
                                </Card>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={scheduleAndNotify} disabled={loading}>
                                {loading ? "Agendando..." : "Confirmar"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
};

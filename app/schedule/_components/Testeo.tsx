"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { format, isBefore, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogHeader, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CountryCodeSelect } from "@/components/custom/CountryCodeSelect";

import { ScheduleInterface } from "@/schema/schema";
import { SeguimientoInput } from "@/schema/seguimientos";

import { createAppointment } from "@/actions/appointments-actions";
import { getAvailableSlots } from "@/actions/getAvailableSlots-actions";
import { sendingMessages } from "@/actions/sending-messages-actions";
import { createSeguimiento } from "@/actions/seguimientos-actions";
import { normalizeTimeToSeconds, subtractSecondsFromTime } from "../helpers";

import { CalendarIcon, CheckCircle2, Clock, User2 } from "lucide-react";

export const Testeo = ({ user, reminders, countries }: ScheduleInterface) => {
    // ── UI State (4 pasos)
    const [step, setStep] = useState(0); // 0 Servicio, 1 Fecha/Hora, 2 Datos, 3 Revisión
    const stepLabel = [
        { label: "Servicio", icon: <Clock className="h-4 w-4" /> },
        { label: "Fecha y hora", icon: <CalendarIcon className="h-4 w-4" /> },
        { label: "Tus datos", icon: <User2 className="h-4 w-4" /> },
        { label: "Revisión", icon: <CheckCircle2 className="h-4 w-4" /> },
    ];

    // ── Datos existentes en tu flujo
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const appointmentHour = 1;
    const instanceName = user.instancias[0]?.instanceName ?? "";

    // ── Selecciones
    const [selectedService, setSelectedService] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [areaCode, setAreaCode] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);

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
        if (!user.id || !selectedDate) return;
        (async () => {
            const res = await getAvailableSlots(user.id as string, selectedDate);
            if (res.success) setSlots(res.data || []);
            else toast.error(res.message);
        })();
    }, [user.id, selectedDate]);

    // ── Helpers UI
    const formatDateLabel = (d?: Date) => {
        if (!d) return "Selecciona una fecha";
        const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        return `${weekdays[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const groupedSlots = useMemo(() => {
        const toMin = (iso: string) => {
            const d = toZonedTime(new Date(iso), timezone);
            return d.getHours() * 60 + d.getMinutes();
        };
        const withLabel = slots
            .slice()
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .map((s) => {
                const d = toZonedTime(new Date(s.startTime), timezone);
                return { ...s, label: format(d, "hh:mm a"), minutes: toMin(s.startTime) };
            });

        return {
            morning: withLabel.filter((s) => s.minutes < 12 * 60),
            afternoon: withLabel.filter((s) => s.minutes >= 12 * 60 && s.minutes < 18 * 60),
            evening: withLabel.filter((s) => s.minutes >= 18 * 60),
        };
    }, [slots, timezone]);

    const canContinueStep1 = Boolean(selectedDate && selectedSlot);
    const canContinueStep2 = Boolean(name.trim() && phone.trim() && areaCode && selectedService);

    // ── Confirmación + notificación (con envío al owner)
    const handleConfirmAppointment = async () => {
        if (!name || !phone || !selectedSlot || !selectedDate || !selectedService || !areaCode) {
            toast.error("Todos los campos son obligatorios.");
            return;
        }
        if (!reminders) return toast.error("missing reminders");

        const [startTime, endTime] = selectedSlot.split("|");
        const areaDigits = areaCode.replace(/\D/g, "");
        const phoneDigits = phone.replace(/\D/g, "");
        const fullPhone = `${areaDigits}${phoneDigits}`;
        const remoteJid = `${fullPhone}@s.whatsapp.net`;

        setLoading(true);

        try {
            const res = await createAppointment({
                userId: user.id,
                pushName: name,
                phone: remoteJid, // lo dejas como lo tienes
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

            secondsReminders.forEach((rem) => {
                if (!rem.normalizedSeconds) return;
                const startLocal = toZonedTime(new Date(startTime), timezone);
                const seguimientoTime = subtractSecondsFromTime(startLocal, rem.normalizedSeconds);
                const dataSeguimiento: SeguimientoInput = {
                    idNodo: "",
                    serverurl: rem.serverUrl ? `https://${rem.serverUrl}` : undefined,
                    instancia: rem.instanceName ?? undefined,
                    apikey: rem.apikey ?? undefined,
                    remoteJid,
                    mensaje: `*${name}* ${rem.description}`,
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

                // Datos de fecha/hora legibles en la TZ de la cita
                const startLocal = toZonedTime(new Date(startTime), timezone);
                const dateLabel = format(selectedDate!, "PPP");
                const hourLabel = format(startLocal, "hh:mm a");

                const serviceName = user.Service.find((s) => s.id === selectedService)?.name ?? "Asesoría";
                const displayPhone = `+${fullPhone}`;

                const ownerText =
                    `Recordatorio para el dueño de la aplicación:\n` +
                    `✅ Tienes Nueva Cita:\n` +
                    `👤 Nombre: ${name}\n` +
                    `📝 Descripción: ${serviceName}, para el día ${dateLabel} a las ${hourLabel}.\n` +
                    `WhatsApp del usuario:\n` +
                    `👉 ${displayPhone}`;

                try {
                    const ownerRes = await sendingMessages({ url, apikey, remoteJid: ownerJid, text: ownerText });
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
        const currentService = user.Service.find((s) => s.id === selectedService);
        const text = currentService?.messageText ? `*${name}*${currentService?.messageText}` : "This is a default notification from Verzay APP. You have an appointment, right?";

        const areaDigits = areaCode.replace(/\D/g, "");
        const phoneDigits = phone.replace(/\D/g, "");
        const fullPhone = `${areaDigits}${phoneDigits}`;
        const remoteJid = `${fullPhone}@s.whatsapp.net`;

        try {
            await handleConfirmAppointment();
            const result = await sendingMessages({ url, apikey, remoteJid, text });
            if (result.success) toast.success(result.message);
            else toast.warning(`No se pudo enviar el mensaje: ${result.message}`);
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
        setName("");
        setAreaCode("");
        setPhone("");
        setLoading(false);
        setOpenDialog(false);
    };

    // ───────────────── UI ─────────────────
    return (
        <>
            <div className="w-full min-h-[100vh] p-4 sm:p-8">
                <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 max-h-98vh">
                    {/* Columna izquierda: contenido por pasos */}
                    <div className="space-y-6">
                        {/* Stepper */}
                        <Card className="border-muted/50">
                            <CardContent className="p-4 sm:p-6">
                                <div className="grid grid-cols-4 gap-2">
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
                                    <div className="text-xs text-muted-foreground">Duración: {appointmentHour} hrs</div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Paso 0: Servicio */}
                        {step === 0 && (
                            <Card className="border-muted/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Selecciona un servicio</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
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

                                    <div className="flex justify-end">
                                        <Button onClick={() => setStep(1)} disabled={!selectedService}>
                                            Continuar
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Paso 1: Fecha y hora */}
                        {step === 1 && (
                            <Card className="border-muted/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Elige fecha y horario</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Los horarios se muestran en tu zona horaria: <span className="font-medium">{timezone}</span>.
                                    </p>
                                </CardHeader>
                                <CardContent className="grid lg:grid-cols-2 gap-6">
                                    <div className="rounded-2xl border p-2">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={(d) => {
                                                setSelectedDate(d);
                                                setSelectedSlot(null);
                                            }}
                                            className="rounded-md"
                                            disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-xs font-medium mb-2 text-muted-foreground">{formatDateLabel(selectedDate)}</div>

                                            {/* Chips agrupados */}
                                            <div className="space-y-3">
                                                {groupedSlots.morning.length > 0 && (
                                                    <div>
                                                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Mañana</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {groupedSlots.morning.map((s) => (
                                                                <Button
                                                                    key={s.startTime}
                                                                    variant={selectedSlot?.startsWith(s.startTime) ? "default" : "outline"}
                                                                    className="rounded-xl"
                                                                    onClick={() => setSelectedSlot(`${s.startTime}|${s.endTime}`)}
                                                                >
                                                                    {s.label}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {groupedSlots.afternoon.length > 0 && (
                                                    <div>
                                                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Tarde</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {groupedSlots.afternoon.map((s) => (
                                                                <Button
                                                                    key={s.startTime}
                                                                    variant={selectedSlot?.startsWith(s.startTime) ? "default" : "outline"}
                                                                    className="rounded-xl"
                                                                    onClick={() => setSelectedSlot(`${s.startTime}|${s.endTime}`)}
                                                                >
                                                                    {s.label}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {groupedSlots.evening.length > 0 && (
                                                    <div>
                                                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Noche</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {groupedSlots.evening.map((s) => (
                                                                <Button
                                                                    key={s.startTime}
                                                                    variant={selectedSlot?.startsWith(s.startTime) ? "default" : "outline"}
                                                                    className="rounded-xl"
                                                                    onClick={() => setSelectedSlot(`${s.startTime}|${s.endTime}`)}
                                                                >
                                                                    {s.label}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {slots.length === 0 && <div className="text-sm text-muted-foreground">Selecciona una fecha para ver horarios.</div>}
                                            </div>
                                        </div>

                                        <div className="flex justify-between gap-2 pt-2">
                                            <Button variant="outline" onClick={() => setStep(0)}>
                                                Atrás
                                            </Button>
                                            <Button disabled={!canContinueStep1} onClick={() => setStep(2)}>
                                                Continuar
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Paso 2: Datos */}
                        {step === 2 && (
                            <Card className="border-muted/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Tus datos</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Nombre completo</Label>
                                            <Input placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>País</Label>
                                            {countries &&
                                                <CountryCodeSelect
                                                    countries={countries}
                                                    defaultValue={areaCode}
                                                    onChange={(code) => setAreaCode(code)}
                                                />}
                                        </div>

                                        <div className="sm:col-span-2 space-y-2">
                                            <Label>WhatsApp</Label>
                                            <Input
                                                placeholder="Número"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                inputMode="tel"
                                                aria-label="Número de WhatsApp"
                                            />
                                            <p className="text-xs text-muted-foreground">Usaremos este número para confirmar tu cita por WhatsApp.</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between gap-2 pt-2">
                                        <Button variant="outline" onClick={() => setStep(1)}>
                                            Atrás
                                        </Button>
                                        <Button disabled={!canContinueStep2} onClick={() => setStep(3)}>
                                            Revisar
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Paso 3: Revisión */}
                        {step === 3 && (
                            <Card className="border-muted/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Revisión y confirmación</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <SummaryItem label="Servicio" value={user.Service.find((s) => s.id === selectedService)?.name} />
                                        <SummaryItem
                                            label="Fecha y hora"
                                            value={
                                                selectedSlot
                                                    ? `${formatDateLabel(selectedDate)} · ${format(
                                                        toZonedTime(new Date(selectedSlot.split("|")[0]), timezone),
                                                        "hh:mm a"
                                                    )} (${timezone})`
                                                    : "—"
                                            }
                                        />
                                        <SummaryItem label="Nombre" value={name} />
                                        <SummaryItem label="Contacto" value={`${areaCode} ${phone}`} />
                                    </div>
                                    <div className="flex justify-between gap-2 pt-2">
                                        <Button variant="outline" onClick={() => setStep(2)}>
                                            Atrás
                                        </Button>
                                        <Button className="px-8" onClick={() => setOpenDialog(true)} disabled={loading}>
                                            {loading ? "Agendando..." : "Confirmar cita"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Columna derecha: Resumen sticky */}
                    <aside className="lg:sticky lg:top-6 h-max">
                        <Card className="border-muted/50 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Resumen</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <SummaryItem label="Servicio" value={user.Service.find((s) => s.id === selectedService)?.name ?? "—"} />
                                <SummaryItem label="Duración" value={`${appointmentHour} hrs`} />
                                <SummaryItem label="Fecha" value={formatDateLabel(selectedDate)} />
                                <SummaryItem
                                    label="Hora"
                                    value={
                                        selectedSlot
                                            ? format(toZonedTime(new Date(selectedSlot.split("|")[0]), timezone), "hh:mm a")
                                            : "—"
                                    }
                                />
                                <SummaryItem label="Zona horaria" value={timezone} />
                                <div className="pt-2">
                                    <Button
                                        className="w-full"
                                        onClick={() => setStep(Math.min(step + 1, 3))}
                                        disabled={step === 3}
                                    >
                                        Siguiente
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Puedes avanzar desde aquí y completar los pasos más tarde.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </aside>
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
                                <ul className="mt-4 text-sm space-y-1">
                                    <li>
                                        <strong>Motivo:</strong> {user.Service.find((s) => s.id === selectedService)?.name}
                                    </li>
                                    <li>
                                        <strong>Nombre:</strong> {name}
                                    </li>
                                    <li>
                                        <strong>Teléfono:</strong> {areaCode} {phone}
                                    </li>
                                    <li>
                                        <strong>Fecha:</strong> {format(selectedDate, "PPP")}
                                    </li>
                                    <li>
                                        <strong>Horario:</strong>{" "}
                                        {selectedSlot &&
                                            format(toZonedTime(new Date(selectedSlot.split("|")[0]), timezone), "hh:mm a")}
                                    </li>
                                </ul>
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

// —— Item de resumen reutilizable
function SummaryItem({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div className="text-sm">
            <div className="text-muted-foreground text-[12px]">{label}</div>
            <div className="font-medium">{value ?? "—"}</div>
        </div>
    );
}

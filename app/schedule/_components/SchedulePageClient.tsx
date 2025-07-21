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
import { toZonedTime } from "date-fns-tz";
import { sendingMessages } from "@/actions/sending-messages-actions";
import { normalizeTimeToSeconds, subtractSecondsFromTime } from "../helpers";
import { useMutation } from "@tanstack/react-query";
import { SeguimientoInput } from "@/schema/seguimientos";
import { createSeguimiento } from "@/actions/seguimientos-actions";

export const SchedulePageClient = ({ user, reminders }: ScheduleInterface) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [name, setName] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const appointmentHour = 1;
  const instanceName = user.instancias[0]?.instanceName ?? "";

  const mutationSeguimiento = useMutation({
    mutationFn: async (data: SeguimientoInput) => await createSeguimiento(data),
    onSuccess: (res) => {
      if (!res.success) return toast.error(res.message)
      // toast.success(res.message)
    },
    onError: () => {
      toast.error("Error inesperado al crear seguimiento")
    },
  });

  useEffect(() => {
    if (user.id && selectedDate) {
      const fetchSlots = async () => {
        const res = await getAvailableSlots(user.id as string, selectedDate);
        if (res.success) setSlots(res.data || []);
        else toast.error(res.message);
      };
      fetchSlots();
    }
  }, [user.id, selectedDate]);

  const handleConfirmAppointment = async () => {
    if (!name || !phone || !selectedSlot || !selectedDate || !selectedService || !areaCode) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }

    if (!reminders) return toast.error('missing reminders');

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
        serviceId: selectedService,
      });

      if (res.success) {
        toast.success("Cita agendada correctamente.");
        resetForm();

        const secondsReminders = reminders.map(reminder => ({
          ...reminder,
          normalizedSeconds: isNaN(normalizeTimeToSeconds(reminder?.time ?? ''))
            ? 0
            : normalizeTimeToSeconds(reminder?.time ?? ''),
        }));


        secondsReminders.forEach(reminder => {
          if (!reminder.normalizedSeconds) return; // skip si no es válido
          const startLocal = toZonedTime(new Date(startTime), timezone);
          const seguimientoTime = subtractSecondsFromTime(startLocal, reminder.normalizedSeconds); // esto retorna '21/07/2025 12:55'
          const remoteJid = `${areaCode}${phone}@s.whatsapp.net`; //TODO: se debe poner el pais por ej +57 debe de ir sin el signo de '+'
          
          const dataSeguimiento = {
            idNodo: '',
            serverurl: reminder.serverUrl ? `https://${reminder.serverUrl}` : undefined,
            instancia: reminder.instanceName ?? undefined,
            apikey: reminder.apikey ?? undefined,
            remoteJid: remoteJid ?? undefined,
            mensaje: reminder.description ?? "",
            tipo: "text",
            time: seguimientoTime,
            name_file: undefined,
            consecutivo: undefined,
            media: undefined,
          };


          mutationSeguimiento.mutate(dataSeguimiento);
        });

      } else {
        toast.error(res.message);
      }
    } catch (error) {
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
    setSelectedService("");
    setAreaCode("");
    setName("");
    setPhone("");
    setLoading(false);
  };


  const scheduleAndNotify = async () => {
    if (!user.apiKey || !user.instancias) return toast.info('Campos incompletos o vacios');
    if (selectedService === '' || !selectedService) return toast.info('Debes seleccionar un servicio');

    const urlevo = user.apiKey?.url;
    const apikey = user.instancias[0].instanceId;
    const url = `https://${urlevo}/message/sendText/${instanceName}`;
    const currentService = user.Service.filter(s => s.id === selectedService)[0];
    const msgFromService = currentService.messageText;
    const text = msgFromService ?? "This is a default notification from Verzay APP. You has a appointment, rigth?";
    const remoteJid = `${areaCode}${phone}@s.whatsapp.net`; //TODO: se debe poner el pais por ej +57 debe de ir sin el signo de '+'

    try {
      await handleConfirmAppointment();
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


  const handlePreview = () => {
    if (!name || !phone || !selectedSlot || !selectedDate) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }

    setOpenDialog(true);
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
              {[...slots]
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((slot) => {
                  const startLocal = toZonedTime(new Date(slot.startTime), timezone);

                  return (
                    <Button
                      variant={`${selectedSlot?.startsWith(slot.startTime) ? "default" : "outline"}`}
                      key={slot.startTime}
                      onClick={() => setSelectedSlot(`${slot.startTime}|${slot.endTime}`)}
                    >
                      {format(startLocal, "hh:mm a")}
                    </Button>
                  );
                })}
            </div>
          )}
        </ScrollArea>

        {slots.length > 0 && (
          <div className="flex flex-col gap-2 w-full">
            <div className="space-y-2">
              <Input placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">+</span>

                <Input
                  placeholder="57"
                  className="w-20"
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value)}
                  inputMode="numeric"
                  maxLength={4}
                  aria-label="Código de país"
                />

                <Input
                  placeholder=" WhatsApp"
                  className="flex-1"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  aria-label="Número de WhatsApp"
                />
              </div>


            </div>

            <Button onClick={handlePreview} disabled={loading} className="w-full">
              {loading ? "Agendando..." : "Confirmar cita"}
            </Button>
          </div>
        )}
      </div>

      {selectedDate && (
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
                      const [start] = selectedSlot.split("|");
                      const startLocal = toZonedTime(new Date(start), timezone);
                      return `${format(startLocal, "hh:mm a")}`;
                    })()}
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

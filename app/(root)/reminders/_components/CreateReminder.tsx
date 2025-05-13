"use client"

import { Controller, useForm } from "react-hook-form"
import { useEffect, useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { getSessionsByUserId } from "@/actions/session-action"
import { Session } from '@prisma/client';
import { DateTimePicker, SelectComboBox, UtilComboBox } from "@/components/custom"
import { toast } from "sonner"
import { reminderSchema, repeatTypes } from "@/schema/reminder"


type FormValues = z.infer<typeof reminderSchema>

interface reminderInterface {
  userId: string,
  serverUrl: string,
  apikey: string,
};

export const CreateReminder = ({ userId, serverUrl, apikey }: reminderInterface) => {
  const [leads, setLeads] = useState<Session[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [CreateDialog, setCreateDialog] = useState(false);

  // const createReminder = useMutation({
  //   mutationFn: async (data: FormValues) => {
  //     return fetch("/api/reminders", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ ...data, instanceName: "inst", serverUrl: "url", apikey: "key", workflowId: "flow" })
  //     })
  //   },
  //   onSuccess: () => form.reset()
  // });

  const form = useForm<FormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: "",
      description: "",
      time: new Date(),
      repeatType: "NONE",
      repeatEvery: undefined,
      userId: "",
      remoteJid: "",
      instanceName: "",
      pushName: "",
      workflowId: "",
    }
  });

  useEffect(() => {
    async function fetchStats() {
      const res = await getSessionsByUserId(userId);
      if (res.success && res.data) {
        setLeads(res.data);
      }
    }
    fetchStats();
  }, [userId]);


  const { register, handleSubmit, setValue, watch, formState: { errors } } = form

  const onSubmit = (data: FormValues) => {
    debugger;
    const payload = {
      ...data,
      serverUrl,
      apikey,
    };

    console.log({ payload })
  };

  const onError = (errors: typeof form.formState.errors) => {
    const allMessages = Object.values(errors)
      .map((err) => err?.message)
      .filter(Boolean)

    toast.error("Revisa los campos obligatorios", {
      description: (
        <ul className="text-xs mt-2 space-y-1 list-disc list-inside">
          {allMessages.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      ),
    })
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4 p-6 rounded-2xl shadow-lg">

      <Input placeholder="Título" {...register("title")} />
      {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}

      <Textarea placeholder="Descripción" {...register("description")} />

      <div>
        <DateTimePicker
          value={watch("time")}
          onChange={(val) => setValue("time", val)}
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Tipo de Repetición</label>
        <Controller
          control={form.control}
          name="repeatType"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {repeatTypes.map((rt) => (
                  <SelectItem key={rt.value} value={rt.value}>
                    {rt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <Input type="number" placeholder="Cada cuántos (días/meses...)" {...register("repeatEvery")} />

      <div>
        <SelectComboBox
          leads={leads}
          onSelect={(lead) => {
            setValue("userId", lead.userId, { shouldValidate: true, shouldDirty: true })
            setValue("remoteJid", lead.remoteJid, { shouldValidate: true, shouldDirty: true })
            setValue("instanceName", lead.instanceId, { shouldValidate: true, shouldDirty: true })
            setValue("pushName", lead.pushName, { shouldValidate: true, shouldDirty: true })
          }}
          onLeadCreated={() => console.log('Hey!')}
        />
      </div>

      <Button type="submit" className="w-full">Crear Recordatorio</Button>
    </form>
  )
}

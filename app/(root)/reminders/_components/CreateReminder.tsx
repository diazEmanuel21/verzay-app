"use client"

import { Controller, useForm } from "react-hook-form"
import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateTimePicker, SelectComboBox, SelectWorkflowBox } from "@/components/custom"
import { toast } from "sonner"
import { formValuesReminderSchema, reminderInterface, reminderSchema, repeatTypes } from "@/schema/reminder"
import { useRouter } from "next/navigation"
import { createReminder } from "@/actions/reminders-actions"
import { zodResolver } from "@hookform/resolvers/zod"

export const CreateReminder = ({ userId, serverUrl, apikey, onSuccess, workflows, leads }: reminderInterface) => {
  const router = useRouter();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [CreateDialog, setCreateDialog] = useState(false);

  const reminderForm = useForm<formValuesReminderSchema>({
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
      apikey: "",
      serverUrl: "",
    }
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = reminderForm

  const onCreateReminder = useMutation({
    mutationFn: async (data: formValuesReminderSchema) => {
      return await createReminder(data);
    },
    onSuccess: (res) => {
      reminderForm.reset()

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message, { id: 'reminder-form' });
      router.refresh();
    },
    onError: (error: any) => {
      console.error("Error crítico al guardar recordatorio:", error);
      toast.error("Error inesperado al guardar recordatorio.", {
        id: 'reminder-form',
      });
    },
    onSettled: () => {
      if (onSuccess) return onSuccess();
    },
  });

  useEffect(() => {
    setValue("apikey", apikey, { shouldValidate: true })
    setValue("serverUrl", serverUrl, { shouldValidate: true })
  }, [apikey, serverUrl, setValue,])

  const onSubmit = (payload: formValuesReminderSchema) => {
    onCreateReminder.mutate(payload)
  };

  const onError = (errors: typeof reminderForm.formState.errors) => {
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
    <form onSubmit={handleSubmit(onSubmit, onError)} className="flex flex-col overflow-hidden gap-4 p-4">
      <input type="hidden" {...register("userId")} />
      <input type="hidden" {...register("remoteJid")} />
      <input type="hidden" {...register("instanceName")} />
      <input type="hidden" {...register("pushName")} />
      <input type="hidden" {...register("workflowId")} />
      <input type="hidden" {...register("apikey")} />
      <input type="hidden" {...register("serverUrl")} />

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
          control={reminderForm.control}
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
      {/* lead */}
      <div>
        <SelectComboBox
          leads={leads}
          onSelect={(lead) => {
            setValue("userId", lead.userId, { shouldValidate: true, shouldDirty: true })
            setValue("remoteJid", lead.remoteJid, { shouldValidate: true, shouldDirty: true })
            setValue("instanceName", lead.instanceId, { shouldValidate: true, shouldDirty: true })
            setValue("pushName", lead.pushName, { shouldValidate: true, shouldDirty: true })
          }}
          onLeadCreated={() => setCreateDialog(true)}
        />
      </div>

      {/* Workflow */}
      <div>
        <SelectWorkflowBox
          workflows={workflows}
          onSelect={(workflow) => {
            setValue("workflowId", workflow.id, { shouldValidate: true, shouldDirty: true })
          }}
        />
      </div>

      <Button type="submit" disabled={onCreateReminder.isPending} className="w-full">
        {onCreateReminder.isPending ? "Creando..." : "Crear Recordatorio"}
      </Button>
    </form>
  )
}